import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../store/authStore';
import { useFacilityStore } from '../../store/facilityStore';
import { useBillingStore } from '../../store/billingStore';
import { getFacilityConfig, saveCustomFacilityTypes } from '../../utils/facilityTypeConfig';
import api from '../../services/api';
import toast from 'react-hot-toast';

import { MyAccountTab, FacilityProfileTab, NotificationsTab } from './ProfileSettings';
import { BranchesTab } from './BranchSettings';
import { QueueSettingsTab, FacilityTypesTab, DangerZoneTab } from './StaffSettings';
import { SubscriptionTab } from './SubscriptionSettings';
import { AppearanceTab } from './AppearanceSettings';

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

export default function Settings() {
  const { user } = useAuthStore();
  const { facilityId, facilityType, facilityName, facilityLogo, setFacility } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

  const tabs = [
    { id: 'profile', label: 'My Account', icon: 'manage_accounts' },
    { id: 'facility', label: 'Facility Profile', icon: 'business' },
    { id: 'branches', label: 'Branches', icon: 'map' },
    { id: 'queue', label: 'Queue & Tokens', icon: 'queue' },
    { id: 'facilityTypes', label: 'Facility Types', icon: 'category' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'subscription', label: 'Subscription & Billing', icon: 'credit_card' },
    { id: 'danger', label: 'Danger Zone', icon: 'warning' }
  ];

  const [activeTab, setActiveTab] = useState('facility');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [facilityData, setFacilityData] = useState(null);
  const [loadingFacility, setLoadingFacility] = useState(true);
  const [showMobileTabsDropdown, setShowMobileTabsDropdown] = useState(false);

  // LIFTED FONT SIZE STATE
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');

  // DYNAMIC CLASSES BASED ON FONT SIZE
  const layoutPadding = fontSize === 'small' ? 'p-3 md:p-4' : fontSize === 'large' ? 'p-6 md:p-8' : 'p-4 md:p-5';
  const layoutGap = fontSize === 'small' ? 'gap-3' : fontSize === 'large' ? 'gap-6' : 'gap-4';
  const sidebarWidth = fontSize === 'small' ? 'lg:w-48' : fontSize === 'large' ? 'lg:w-64' : 'lg:w-52';
  const headerMargin = fontSize === 'small' ? 'mb-3' : fontSize === 'large' ? 'mb-6' : 'mb-4';

  const fetchFacilityData = useCallback(async () => {
    try {
      setLoadingFacility(true);
      const response = await api.get('/facility/me');
      if (response.data && response.data.data) {
        const facility = response.data.data;
        setFacilityData(facility);

        // Sync custom fields from database to localStorage for cross-device consistency
        if (facility.customFields) {
          const customTypes = facility.customFields.customFacilityTypes || {};
          const deletedKeys = facility.customFields.deletedFacilityTypes || [];

          localStorage.setItem(`queue-md-custom-facility-types-${facilityId}`, JSON.stringify(customTypes));
          localStorage.setItem(`queue-md-deleted-facility-types-${facilityId}`, JSON.stringify(deletedKeys));

          // Apply instantly to runtime configuration
          saveCustomFacilityTypes(facilityId, customTypes, deletedKeys);
        }
      }
    } catch (err) {
      console.error("Fetch facility error:", err);
    } finally {
      setLoadingFacility(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchFacilityData();
  }, [fetchFacilityData]);

  // Click outside to close mobile tab dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-mobile-tabs-container]')) {
        setShowMobileTabsDropdown(false);
      }
    };
    if (showMobileTabsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileTabsDropdown]);

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/facility/update', {
        facilityId,
        ...pendingChanges
      });

      // Update global facilityName/facilityLogo in store if modified
      if (pendingChanges.name || pendingChanges.logo) {
        const updatedFacilityData = response.data?.data || {};
        const newLogo = pendingChanges.logo || updatedFacilityData.logo || facilityLogo;
        setFacility(facilityId, pendingChanges.name || facilityName, facilityType, newLogo);
      }

      // Update local facilityData state
      if (response.data && response.data.data) {
        setFacilityData(response.data.data);
      } else {
        setFacilityData(prev => ({ ...prev, ...pendingChanges }));
      }

      // Save locally to simulate persistence for other custom fields
      const localStorageKey = `queue-md-facility-settings-${facilityId}`;
      const existingSettings = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      localStorage.setItem(localStorageKey, JSON.stringify({ ...existingSettings, ...pendingChanges }));

      toast.success('Settings saved successfully! ✅');
      setPendingChanges({});
    } catch (err) {
      console.log('API not ready or update path not defined, saving locally to context');
      if (pendingChanges.name || pendingChanges.logo) {
        const newLogo = pendingChanges.logo || facilityLogo;
        setFacility(facilityId, pendingChanges.name || facilityName, facilityType, newLogo);
      }
      const localStorageKey = `queue-md-facility-settings-${facilityId}`;
      const existingSettings = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      localStorage.setItem(localStorageKey, JSON.stringify({ ...existingSettings, ...pendingChanges }));

      setFacilityData(prev => ({ ...prev, ...pendingChanges }));
      toast.success('Settings saved successfully! ✅');
      setPendingChanges({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setPendingChanges(prev => ({ ...prev, [field]: value }));
  };

  const renderTabContent = () => {
    const facility = facilityData || { _id: facilityId, facilityId, facilityType, facilityName };

    switch (activeTab) {
      case 'profile':
        return <MyAccountTab user={user} />;
      case 'facility':
        return <FacilityProfileTab facility={facility} onSave={handleFieldChange} config={config} />;
      case 'branches':
        return <BranchesTab facilityId={facilityId} />;
      case 'queue':
        return <QueueSettingsTab facility={facility} onSave={handleFieldChange} config={config} />;
      case 'facilityTypes':
        return <FacilityTypesTab facility={facility} />;
      case 'appearance':
        return <AppearanceTab config={config} fontSize={fontSize} setFontSize={setFontSize} />;
      case 'notifications':
        return <NotificationsTab facilityId={facilityId} />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'danger':
        return <DangerZoneTab user={user} facility={facility} onRefresh={fetchFacilityData} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className={`w-full max-w-5xl mx-auto pb-32 px-4 md:px-5`}>
        {/* Header */}
        <div className={`${headerMargin} flex items-center gap-3`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.1)`,
              color: config.theme.primary,
              borderColor: `rgba(${primaryRgb}, 0.25)`
            }}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </div>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-black text-text-primary tracking-tight leading-none">System Settings</h1>
          </div>
        </div>

        <div className={`flex flex-col lg:flex-row ${layoutGap}`}>
          {/* Tabs Sidebar */}
          <div className={`${sidebarWidth} flex-shrink-0`}>
            {/* Desktop: Vertical */}
            <div className="hidden lg:flex flex-col gap-1 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 p-2.5 shadow-sm">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 text-xs font-bold ${isActive
                      ? 'text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary'
                      }`}
                    style={isActive ? {
                      backgroundColor: config.theme.primary,
                      boxShadow: `0 4px 12px rgba(${primaryRgb}, 0.25)`
                    } : {}}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile: Custom Dropdown Menu */}
            <div className="lg:hidden relative mb-4" data-mobile-tabs-container>
              <button
                onClick={() => setShowMobileTabsDropdown(!showMobileTabsDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-2xl text-xs font-bold text-text-primary active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: config.theme.primary }}>
                    {tabs.find(t => t.id === activeTab)?.icon}
                  </span>
                  <span>{tabs.find(t => t.id === activeTab)?.label}</span>
                </div>
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: showMobileTabsDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>
              
              {showMobileTabsDropdown && (
                <div className="absolute top-[105%] left-0 w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-2xl shadow-xl p-2 z-30 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMobileTabsDropdown(false);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 text-xs font-bold ${isActive
                          ? 'text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary'
                          }`}
                        style={isActive ? {
                          backgroundColor: config.theme.primary,
                        } : {}}
                      >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className={`flex-1 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 ${layoutPadding} shadow-sm transition-all duration-300 min-h-[400px]`}>
            {loadingFacility ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-text-secondary">
                <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                <p className="text-xs mt-2 font-medium">Loading system configuration...</p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>

        {/* Save Bar */}
        {Object.keys(pendingChanges).length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border-muted/30 dark:border-white/10 bg-bg-primary/95 backdrop-blur-sm p-4 z-40 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-4">
              <p className="text-sm text-text-secondary font-medium">You have unsaved changes</p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                style={{
                  backgroundColor: config.theme.primary,
                  boxShadow: `0 4px 12px rgba(${primaryRgb}, 0.25)`
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
