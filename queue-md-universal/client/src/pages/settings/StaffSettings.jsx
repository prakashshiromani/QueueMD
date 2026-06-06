import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FACILITY_TYPES, saveCustomFacilityTypes } from '../../utils/facilityTypeConfig';
import { toPascalCase } from '../../utils/helpers';

export const QueueSettingsTab = ({ facility, onSave, config }) => {
  const facilityId = facility?.facilityId || facility?._id;
  const localStorageKey = `queue-md-facility-settings-${facilityId}`;
  const [savingKey, setSavingKey] = useState(null);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      const dbCustomFields = facility?.customFields || {};
      const getDbVal = (key) => {
        if (dbCustomFields instanceof Map) return dbCustomFields.get(key);
        if (typeof dbCustomFields.get === 'function') return dbCustomFields.get(key);
        return dbCustomFields[key];
      };

      const savedParsed = saved ? JSON.parse(saved) : {};

      return {
        tokenPrefix: getDbVal('tokenPrefix') || savedParsed.tokenPrefix || config.tokenPrefix || 'TKN',
        autoReset: getDbVal('autoReset') ?? savedParsed.autoReset ?? true,
        baseConsultTime: getDbVal('baseConsultTime') || savedParsed.baseConsultTime || config.baseConsultTime || 15,
        notificationTemplate: getDbVal('notificationTemplate') || savedParsed.notificationTemplate || config.notificationTemplate || '',
        maxQueueSize: getDbVal('maxQueueSize') || savedParsed.maxQueueSize || '',
        unlimitedQueue: getDbVal('unlimitedQueue') ?? savedParsed.unlimitedQueue ?? true,
        autoAddToQueue: getDbVal('autoAddToQueue') ?? savedParsed.autoAddToQueue ?? true
      };
    } catch (e) {
      console.error(e);
    }
    return {
      tokenPrefix: config.tokenPrefix || 'TKN',
      autoReset: true,
      baseConsultTime: config.baseConsultTime || 15,
      notificationTemplate: config.notificationTemplate || '',
      maxQueueSize: '',
      unlimitedQueue: true,
      autoAddToQueue: true
    };
  });

  useEffect(() => {
    if (facility) {
      const dbCustomFields = facility.customFields || {};
      const getDbVal = (key) => {
        if (dbCustomFields instanceof Map) return dbCustomFields.get(key);
        if (typeof dbCustomFields.get === 'function') return dbCustomFields.get(key);
        return dbCustomFields[key];
      };

      setSettings(prev => ({
        tokenPrefix: getDbVal('tokenPrefix') || prev.tokenPrefix,
        autoReset: getDbVal('autoReset') ?? prev.autoReset,
        baseConsultTime: getDbVal('baseConsultTime') || prev.baseConsultTime,
        notificationTemplate: getDbVal('notificationTemplate') || prev.notificationTemplate,
        maxQueueSize: getDbVal('maxQueueSize') || prev.maxQueueSize,
        unlimitedQueue: getDbVal('unlimitedQueue') ?? prev.unlimitedQueue,
        autoAddToQueue: getDbVal('autoAddToQueue') ?? prev.autoAddToQueue
      }));
    }
  }, [facility]);

  // ✅ FIX: Save INSTANTLY to backend on toggle change (don't wait for parent "Save Changes" button)
  const handleChange = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    // Also notify parent for non-critical fields (text inputs use parent save flow)
    onSave(key, value);

    // For toggles: immediately persist to backend so server reads correct value
    setSavingKey(key);
    try {
      await api.put('/facility/update', { facilityId, [key]: value });
      // Update localStorage immediately too
      const existing = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      localStorage.setItem(localStorageKey, JSON.stringify({ ...existing, [key]: value }));
      toast.success(`${key === 'autoAddToQueue' ? 'Auto-Queue' : key === 'autoReset' ? 'Auto-Reset' : 'Queue'} setting saved!`);
    } catch (err) {
      console.error('Failed to save setting:', err);
      toast.error('Failed to save setting. Please try again.');
      // Revert UI on failure
      setSettings(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Token Prefix */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Token Prefix</label>
        <input
          type="text"
          value={settings.tokenPrefix}
          onChange={(e) => handleChange('tokenPrefix', e.target.value.toUpperCase().slice(0, 4))}
          className="w-32 bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 px-4 text-text-primary font-mono text-center text-lg focus:outline-none focus:border-border-muted transition-all"
          placeholder="TKN"
        />
        <p className="text-xs text-text-secondary mt-1">Generated Token: <code className="bg-bg-primary px-1.5 py-0.5 rounded font-mono text-emerald-500 font-bold">{settings.tokenPrefix}-001</code></p>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        {[
          { key: 'autoReset', label: 'Auto-Reset Tokens Daily', desc: 'Reset token counter to 1 at midnight' },
          { key: 'unlimitedQueue', label: 'Unlimited Queue Capacity', desc: 'Allow patients to join queue without restriction' },
          { key: 'autoAddToQueue', label: 'Auto-Add Patients to Queue', desc: 'Automatically add newly registered directory patients directly into the active queue' }
        ].map((item) => (
          <div key={item.key} className="flex items-start justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2">
                <p className="font-bold text-text-primary text-sm">{item.label}</p>
                {item.key === 'autoAddToQueue' && (
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    settings[item.key]
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {settings[item.key] ? 'Auto' : 'Manual'}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {savingKey === item.key && (
                <span className="material-symbols-outlined text-[16px] text-text-secondary animate-spin">sync</span>
              )}
              <label className={`relative inline-flex items-center ${savingKey === item.key ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={() => savingKey === item.key ? null : handleChange(item.key, !settings[item.key])}
                  className="sr-only peer"
                  disabled={savingKey === item.key}
                />
                <div className="w-11 h-6 bg-border-muted peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Consult Time Slider */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Base Consult Time</label>
        <div className="flex items-center gap-4 p-4 bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl">
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={settings.baseConsultTime}
            onChange={(e) => handleChange('baseConsultTime', parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-border-muted rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-text-primary font-bold text-sm w-20 text-right bg-bg-secondary px-3 py-1.5 rounded-lg border border-border-muted/50 dark:border-white/5">{settings.baseConsultTime} min</span>
        </div>
      </div>

      {/* Notification Template */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Notification Template</label>
        <textarea
          value={settings.notificationTemplate}
          onChange={(e) => handleChange('notificationTemplate', e.target.value)}
          className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 px-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm min-h-[100px]"
          placeholder="Use #{token} for token number"
        />
        <p className="text-xs text-text-secondary mt-1">Syntax variables: <code className="bg-bg-primary px-1.5 py-0.5 rounded font-mono text-[11px]">#{'{token}'}</code> or <code className="bg-bg-primary px-1.5 py-0.5 rounded font-mono text-[11px]">#{'{sampleId}'}</code></p>
      </div>

      {/* Status Flow Preview */}
      <div className="p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5">
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary mb-3">Department Queue Flow Preview</p>
        <div className="flex items-center gap-2 flex-wrap">
          {config.statusFlow ? (
            config.statusFlow.map((status, idx) => (
              <div key={status} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${status.includes('wait') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  status.includes('progress') || status.includes('chair') || status.includes('session') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                  {status.replace('-', ' ')}
                </span>
                {idx < config.statusFlow.length - 1 && <span className="text-text-secondary font-bold text-sm">→</span>}
              </div>
            ))
          ) : (
            ['waiting', 'in-progress', 'completed'].map((status, idx) => (
              <div key={status} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${status === 'waiting' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                  {status}
                </span>
                {idx < 2 && <span className="text-text-secondary font-bold text-sm">→</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const FacilityTypesTab = ({ facility }) => {
  const facilityId = facility?.facilityId || facility?._id;
  const [customTypes, setCustomTypes] = useState(() => {
    try {
      const saved = localStorage.getItem(`queue-md-custom-facility-types-${facilityId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [deletedTypes, setDeletedTypes] = useState(() => {
    try {
      const saved = localStorage.getItem(`queue-md-deleted-facility-types-${facilityId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Watch for server facility data updates and synchronize component state dynamically
  useEffect(() => {
    if (facility && facility.customFields) {
      const custom = facility.customFields.customFacilityTypes || {};
      const deleted = facility.customFields.deletedFacilityTypes || [];

      setCustomTypes(custom);
      setDeletedTypes(deleted);

      // Sync localStorage and global memory configs immediately
      localStorage.setItem(`queue-md-custom-facility-types-${facilityId}`, JSON.stringify(custom));
      localStorage.setItem(`queue-md-deleted-facility-types-${facilityId}`, JSON.stringify(deleted));
      saveCustomFacilityTypes(facilityId, custom, deleted);
    }
  }, [facility, facilityId]);

  const [editingKey, setEditingKey] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    icon: '🏥',
    primaryColor: '#2563EB',
    secondaryColor: '#10B981',
    tokenPrefix: 'TKN',
    baseConsultTime: 15,
    notificationTemplate: 'Hello #{patientName}, your token #{token} is called.',
    statusFlow: ['waiting', 'in-progress', 'completed'],
    roles: ['Admin', 'Receptionist', 'Doctor', 'Patient']
  });

  const defaults = ['clinic', 'pathlab', 'dental', 'physio', 'hospital'];
  const allMergedTypes = { ...FACILITY_TYPES, ...customTypes };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.label.trim()) return toast.error('Label is required');
    if (!formData.tokenPrefix.trim() || formData.tokenPrefix.length < 2) {
      return toast.error('Token prefix must be at least 2 characters');
    }

    const key = editingKey || formData.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) return toast.error('Invalid department name');

    const updatedConfig = {
      label: formData.label,
      icon: formData.icon,
      theme: { primary: formData.primaryColor, secondary: formData.secondaryColor },
      notificationTemplate: formData.notificationTemplate,
      statusFlow: formData.statusFlow,
      roles: formData.roles,
      tokenPrefix: formData.tokenPrefix.toUpperCase(),
      baseConsultTime: parseInt(formData.baseConsultTime),
      customFields: []
    };

    const newCustomTypes = { ...customTypes, [key]: updatedConfig };

    // If the department was previously marked as deleted, restore it!
    const newDeletedTypes = deletedTypes.filter(d => d !== key);

    try {
      // Sync with localStorage
      saveCustomFacilityTypes(facilityId, newCustomTypes, newDeletedTypes);
      setCustomTypes(newCustomTypes);
      setDeletedTypes(newDeletedTypes);

      // Sync with backend database
      await api.put('/facility/update', {
        facilityId,
        customFacilityTypes: newCustomTypes,
        deletedFacilityTypes: newDeletedTypes
      });

      toast.success(editingKey ? 'Department updated successfully!' : 'New Department created!');
      setEditingKey(null);
      setShowAddForm(false);

      // Reload page to propagate changes dynamically to all pages!
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error('Failed to sync department to server');
    }
  };

  const handleDelete = async (key) => {
    if (Object.keys(allMergedTypes).length <= 1) {
      return toast.error('At least one department must remain active');
    }

    if (!window.confirm(`Are you sure you want to delete the "${allMergedTypes[key]?.label}" department?`)) {
      return;
    }

    const isDefault = defaults.includes(key);
    let newDeletedTypes = [...deletedTypes];
    if (isDefault && !newDeletedTypes.includes(key)) {
      newDeletedTypes.push(key);
    }

    const newCustomTypes = { ...customTypes };
    if (!isDefault) {
      delete newCustomTypes[key];
    }

    try {
      saveCustomFacilityTypes(facilityId, newCustomTypes, newDeletedTypes);
      setCustomTypes(newCustomTypes);
      setDeletedTypes(newDeletedTypes);

      await api.put('/facility/update', {
        facilityId,
        customFacilityTypes: newCustomTypes,
        deletedFacilityTypes: newDeletedTypes
      });

      toast.success('Department deleted successfully');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error('Failed to delete department from server');
    }
  };

  const startEdit = (key) => {
    const config = allMergedTypes[key];
    setEditingKey(key);
    setFormData({
      label: config.label,
      icon: config.icon || '🏥',
      primaryColor: config.theme?.primary || '#2563EB',
      secondaryColor: config.theme?.secondary || '#10B981',
      tokenPrefix: config.tokenPrefix || 'TKN',
      baseConsultTime: config.baseConsultTime || 15,
      notificationTemplate: config.notificationTemplate || '',
      statusFlow: config.statusFlow || ['waiting', 'in-progress', 'completed'],
      roles: config.roles || ['Admin', 'Receptionist', 'Doctor', 'Patient']
    });
    setShowAddForm(true);
  };

  const startAdd = () => {
    setEditingKey(null);
    setFormData({
      label: '',
      icon: '🏥',
      primaryColor: '#2563EB',
      secondaryColor: '#10B981',
      tokenPrefix: 'TKN',
      baseConsultTime: 15,
      notificationTemplate: 'Hello #{patientName}, your token #{token} is called.',
      statusFlow: ['waiting', 'in-progress', 'completed'],
      roles: ['Admin', 'Receptionist', 'Doctor', 'Patient']
    });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary text-lg">Facility Types & Departments</h3>
          <p className="text-xs text-text-secondary mt-1">Configure and manage dynamic department types for QueueMD</p>
        </div>
        {!showAddForm && (
          <button
            onClick={startAdd}
            className="px-5 h-[38px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Add Department
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="p-6 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5 space-y-5">
          <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            {editingKey ? 'Modify Department Configuration' : 'Register New Department'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Department Name</label>
              <input
                type="text"
                disabled={editingKey && defaults.includes(editingKey)}
                value={formData.label}
                onChange={(e) => handleFieldChange('label', toPascalCase(e.target.value))}
                placeholder="e.g. Cardiology"
                className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none focus:border-border-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Token Prefix</label>
              <input
                type="text"
                disabled={editingKey && defaults.includes(editingKey)}
                value={formData.tokenPrefix}
                onChange={(e) => handleFieldChange('tokenPrefix', e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. CAR"
                className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm font-mono focus:outline-none focus:border-border-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Emoji Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => handleFieldChange('icon', e.target.value)}
                className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
              >
                {['🏥', '🔬', '🦷', '🧘', '🏨', '❤️', '🩺', '👁️', '👶', '🧠', '🦴', '🧪', '💊'].map(emoji => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Primary Theme Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                  className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                  className="flex-1 bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 px-3 text-text-primary text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Secondary Theme Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                  className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                  className="flex-1 bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 px-3 text-text-primary text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Base Consult Time: {formData.baseConsultTime} mins</label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={formData.baseConsultTime}
              onChange={(e) => handleFieldChange('baseConsultTime', e.target.value)}
              className="w-full h-1.5 bg-border-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Custom Notification Template</label>
            <textarea
              value={formData.notificationTemplate}
              onChange={(e) => handleFieldChange('notificationTemplate', e.target.value)}
              placeholder="e.g. Hello #{patientName}, Cardiology doctor is ready for you. Token: #{token}"
              className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none focus:border-border-muted min-h-[80px]"
            />
            <p className="text-[10px] text-text-secondary">Placeholders: <code>#{'{token}'}</code>, <code>#{'{patientName}'}</code>, <code>#{'{sampleId}'}</code></p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">
              {editingKey ? 'Save Changes' : 'Create Department'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setEditingKey(null); }}
              className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(allMergedTypes).map(([key, config]) => {
          const isDefault = defaults.includes(key);
          return (
            <div key={key} className="p-5 bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-border-muted transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-bg-secondary rounded-xl">{config.icon}</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-base flex items-center gap-1.5">
                      {config.label}
                      <span className="font-mono text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded border border-border-muted/50">
                        {config.tokenPrefix}
                      </span>
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">Base Time: {config.baseConsultTime} mins</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => startEdit(key)}
                    className="w-8 h-8 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary flex items-center justify-center border border-border-muted/50"
                    title="Edit Department"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(key)}
                    className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/25 flex items-center justify-center border border-rose-500/20"
                    title="Delete Department"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-muted/30 dark:border-white/5 flex justify-between items-center text-xs">
                <div className="flex gap-1">
                  <span className="font-semibold text-text-secondary">Theme:</span>
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: config.theme?.primary }}></span>
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: config.theme?.secondary }}></span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isDefault ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {isDefault ? 'System Default' : 'Custom Dept'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SecurityAuditModal = ({ isOpen, onClose, user }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ todayLogins: 0, todayFailed: 0, criticalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [clearing, setClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDetails, setSelectedDetails] = useState(null); // Collapsed details index/id

  const isAdmin = user?.role === 'admin';

  const fetchLogs = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const response = await api.get('/audit-logs', {
        params: {
          page,
          limit: 10,
          action,
          severity,
          search,
          startDate,
          endDate
        }
      });
      if (response.data?.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, action, severity, search, startDate, endDate, isAdmin]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await api.get('/audit-logs/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      fetchStats();
    }
  }, [isOpen, fetchLogs, fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [action, severity, search, startDate, endDate]);

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      const response = await api.delete('/audit-logs');
      if (response.data?.success) {
        toast.success("Security audit logs cleared successfully! 🧹");
        setShowConfirmClear(false);
        setPage(1);
        fetchLogs();
        fetchStats();
      } else {
        toast.error(response.data?.message || "Failed to clear audit logs");
      }
    } catch (err) {
      console.error("Error clearing audit logs:", err);
      toast.error(err.response?.data?.message || "Failed to clear audit logs. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-bg-secondary w-full max-w-5xl h-[90vh] rounded-3xl border border-border-muted/50 dark:border-white/5 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-border-muted/30 dark:border-white/5 flex items-center justify-between bg-bg-primary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <span className="material-symbols-outlined">shield_lock</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                System Security Audit Logs
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">Track administrator changes, authentication events, and suspicious behavior.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && logs.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 hover:text-rose-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                Clear Logs
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-bg-primary hover:bg-border-muted/20 border border-border-muted/50 dark:border-white/5 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Lock Screen if Not Admin */}
        {!isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <h4 className="text-xl font-bold text-text-primary">Administrator Authorization Required</h4>
            <p className="text-sm text-text-secondary max-w-md leading-relaxed">
              This panel contains highly sensitive system data, including login IPs, settings changes, and authentication logs. Only authorized Administrator accounts can access this tab.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="p-6 bg-bg-primary/20 border-b border-border-muted/30 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-bg-primary/60 border border-border-muted/30 dark:border-white/5 rounded-2xl flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center material-symbols-outlined">login</span>
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Today's Successful Logins</p>
                  <p className="text-xl font-black text-emerald-500 mt-0.5">{stats.todayLogins}</p>
                </div>
              </div>

              <div className="p-4 bg-bg-primary/60 border border-border-muted/30 dark:border-white/5 rounded-2xl flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center material-symbols-outlined">no_accounts</span>
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Today's Failed Attempts</p>
                  <p className="text-xl font-black text-amber-500 mt-0.5">{stats.todayFailed}</p>
                </div>
              </div>

              <div className="p-4 bg-bg-primary/60 border border-border-muted/30 dark:border-white/5 rounded-2xl flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center material-symbols-outlined">warning</span>
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Total Critical Alerts</p>
                  <p className="text-xl font-black text-rose-500 mt-0.5">{stats.criticalCount}</p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-6 border-b border-border-muted/30 dark:border-white/5 bg-bg-secondary grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search user, IP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 pl-9 pr-3 text-text-primary text-xs focus:outline-none focus:border-border-muted"
                />
              </div>

              <div>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 px-3 text-text-primary text-xs focus:outline-none"
                >
                  <option value="all">All Action Types</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="LOGIN_FAILED">Login Failed</option>
                  <option value="PASSWORD_CHANGED">Password Change</option>
                  <option value="FACILITY_UPDATED">Facility Settings Update</option>
                  <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                </select>
              </div>

              <div>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 px-3 text-text-primary text-xs focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 px-3 text-text-primary text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-2 px-3 text-text-primary text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Log Table / List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-text-secondary">
                  <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                  <p className="text-xs mt-2 font-medium">Fetching secure security log records...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-secondary">
                  <span className="material-symbols-outlined text-[48px] opacity-25">gpp_maybe</span>
                  <h4 className="text-sm font-bold text-text-primary mt-2">No Security Events Found</h4>
                  <p className="text-xs mt-1 max-w-sm">No security logs match your current filter selection or no actions have been taken yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border-muted/30 dark:divide-white/5">
                  {logs.map((log) => {
                    const isCritical = log.severity === 'critical';
                    const isWarning = log.severity === 'warning';

                    let severityColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                    if (isCritical) severityColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                    else if (isWarning) severityColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";

                    let actionColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                    if (log.action === "LOGIN_SUCCESS") actionColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                    else if (log.action === "LOGIN_FAILED") actionColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                    else if (log.action === "SUSPICIOUS_ACTIVITY") actionColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";

                    return (
                      <div
                        key={log._id}
                        className={`p-4 transition-colors hover:bg-bg-primary/30 flex flex-col space-y-2.5 ${isCritical ? "bg-rose-500/[0.02]" : isWarning ? "bg-amber-500/[0.01]" : ""
                          }`}
                      >
                        {/* Upper row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider border uppercase ${actionColor}`}>
                              {log.action.replace("_", " ")}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider border uppercase ${severityColor}`}>
                              {log.severity}
                            </span>
                            <span className="text-[11px] text-text-secondary">
                              {new Date(log.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-text-secondary flex items-center gap-2">
                            <span className="bg-bg-primary border border-border-muted/50 dark:border-white/5 px-2 py-0.5 rounded">IP: {log.ipAddress || '—'}</span>
                            <span className="max-w-[150px] truncate bg-bg-primary border border-border-muted/50 dark:border-white/5 px-2 py-0.5 rounded" title={log.userAgent}>Device: {log.userAgent || '—'}</span>
                          </div>
                        </div>

                        {/* Lower row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-500/10 flex items-center justify-center font-bold text-[10px] text-text-primary border border-border-muted/30">
                              {log.userName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-text-primary">{log.userName || 'Unknown User'}</span>
                              <span className="text-text-secondary ml-1.5 text-[11px]">({log.userEmail || 'no-email'})</span>
                              <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider text-text-secondary bg-bg-primary px-1.5 py-0.5 rounded border border-border-muted/30">{log.userRole || 'guest'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {log.details && Object.keys(log.details).length > 0 && (
                              <button
                                onClick={() => setSelectedDetails(selectedDetails === log._id ? null : log._id)}
                                className="px-2.5 py-1 rounded bg-bg-primary hover:bg-border-muted/20 border border-border-muted/50 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:text-text-primary flex items-center gap-1 transition-all"
                              >
                                {selectedDetails === log._id ? 'Hide details' : 'View payload'}
                                <span className="material-symbols-outlined text-[12px]">{selectedDetails === log._id ? 'expand_less' : 'expand_more'}</span>
                              </button>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }`}>
                              {log.status}
                            </span>
                          </div>
                        </div>

                        {/* Collapsed Details Payload JSON */}
                        {selectedDetails === log._id && log.details && (
                          <div className="mt-2 p-3 bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl font-mono text-[10px] text-text-primary/95 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border-muted/30 dark:border-white/5 flex items-center justify-between bg-bg-primary/30 text-xs">
                <span className="text-text-secondary font-medium">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-primary font-bold hover:bg-border-muted/20 disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span> Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-primary font-bold hover:bg-border-muted/20 disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    Next <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Clear Logs Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-bg-secondary rounded-3xl border border-border-muted/50 dark:border-white/5 p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-text-primary">Clear Audit Logs</h3>
                <p className="text-xs text-text-secondary mt-0.5">This action is highly sensitive and permanent.</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to delete all security audit logs for this facility? This action cannot be undone. However, a new audit entry will be recorded to document that the logs were cleared.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-xl bg-bg-primary hover:bg-border-muted/20 border border-border-muted/50 dark:border-white/5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                disabled={clearing}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Clearing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    Permanently Clear
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DangerZoneTab = ({ user, facility, onRefresh }) => {
  const [confirmArchive, setConfirmArchive] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Re-authentication states
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [reauthAction, setReauthAction] = useState(null); // 'audit' | 'archive' | 'restore' | 'reset'

  // Safely extract facilityId — MongoDB _id could be an object, so convert to string
  const facilityId =
    (facility?.id && String(facility.id)) ||
    (facility?._id && String(facility._id)) ||
    (facility?.facilityId && String(facility.facilityId)) ||
    (user?.facilityId && String(user.facilityId)) || '';
  const currentFacilityName = facility?.name || facility?.facilityName || '';

  const handleExport = () => {
    const data = JSON.stringify({ facility, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queuemd-export-${Date.now()}.json`;
    a.click();
    toast.success('Facility data exported successfully 📥');
  };

  const handleArchiveInitiate = () => {
    if (confirmArchive !== currentFacilityName) {
      toast.error('Please type facility name correctly to confirm');
      return;
    }
    setShowArchiveModal(false);
    setConfirmArchive('');
    setReauthAction('archive');
    setShowPasswordConfirmModal(true);
  };

  const handleRestoreInitiate = () => {
    setReauthAction('restore');
    setShowPasswordConfirmModal(true);
  };

  const handleResetInitiate = () => {
    if (confirmReset !== 'RESET') {
      toast.error('Please type "RESET" in uppercase to confirm');
      return;
    }
    setShowResetModal(false);
    setConfirmReset('');
    setReauthAction('reset');
    setShowPasswordConfirmModal(true);
  };

  const handlePasswordConfirm = async (e) => {
    e.preventDefault();
    if (!confirmPassword) return;

    // Capture reauthAction before any async ops
    const action = reauthAction;
    const fid = facilityId;

    if (!fid) {
      toast.error('Facility ID not found. Please refresh and try again.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.post('/auth/verify-password', {
        password: confirmPassword
      });

      if (response.data?.success) {
        setShowPasswordConfirmModal(false);
        setConfirmPassword('');
        setShowConfirmPassword(false);
        setReauthAction(null);

        if (action === 'audit') {
          setShowAuditModal(true);
          toast.success('Identity verified successfully! 🛡️');
        } else if (action === 'archive') {
          // Perform archival
          const res = await api.patch(`/facility/${fid}/archive`);
          if (res.data?.success) {
            toast.success('Facility archived successfully. Staff login access has been blocked. 📦');
            if (onRefresh) onRefresh();
          } else {
            toast.error(res.data?.message || 'Failed to archive facility.');
          }
        } else if (action === 'restore') {
          // Perform restoration
          const res = await api.patch(`/facility/${fid}/restore`);
          if (res.data?.success) {
            toast.success('Facility restored successfully! Staff access re-enabled. 🟢');
            if (onRefresh) onRefresh();
          } else {
            toast.error(res.data?.message || 'Failed to restore facility.');
          }
        } else if (action === 'reset') {
          // Perform daily reset
          const res = await api.post(`/queue/reset-daily`);
          if (res.data?.success) {
            toast.success("Queue logs flushed and token counter reset to 1 successfully! 🟢");
            if (onRefresh) onRefresh();
          } else {
            toast.error(res.data?.message || 'Failed to reset queue.');
          }
        }
      } else {
        toast.error('Incorrect password. Access denied.');
      }
    } catch (err) {
      console.error('[DangerZone] Action failed:', action, err);
      toast.error(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Security Audit Log Modal */}
      <SecurityAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        user={user}
      />

      {/* Password Confirmation Modal */}
      {showPasswordConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handlePasswordConfirm} className="bg-bg-secondary rounded-3xl border border-border-muted/50 dark:border-white/5 p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined">security</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-text-primary">Confirm Admin Access</h3>
                <p className="text-xs text-text-secondary mt-0.5">Please confirm your password to proceed.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-bg-primary/50 border border-border-muted/30 rounded-xl text-xs">
                <p className="font-medium text-text-secondary">Administrator Email</p>
                <p className="font-bold text-text-primary mt-0.5">{user?.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Password</label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3 pl-4 pr-12 text-text-primary text-sm focus:outline-none focus:border-border-muted"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all"
              >
                {isVerifying ? 'Verifying...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordConfirmModal(false);
                  setConfirmPassword('');
                  setShowConfirmPassword(false);
                  setReauthAction(null);
                }}
                className="px-5 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Status', value: facility?.isActive !== false ? '🟢 Operational' : '🔴 Archived', color: facility?.isActive !== false ? 'text-emerald-500' : 'text-rose-500' },
          { label: 'Current Plan', value: facility?.subscriptionPlan === 'pro' ? '💎 Pro Plan' : '🆓 Free Plan', color: 'text-blue-500' },
          { label: 'Today\'s Limit', value: 'Unlimited', color: 'text-text-primary' }
        ].map((card) => (
          <div key={card.label} className="p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5">
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wide">{card.label}</p>
            <p className={`font-black text-sm mt-1 capitalize ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-3">
        <button
          onClick={handleExport}
          className="w-full py-3.5 px-4 rounded-2xl border border-border-muted/50 dark:border-white/5 text-text-primary hover:bg-bg-primary transition text-left text-sm font-bold flex items-center justify-between"
        >
          <span>📥 Export Facility Database (JSON Format)</span>
          <span className="material-symbols-outlined text-[18px] opacity-50">arrow_forward</span>
        </button>
        <button
          onClick={() => {
            if (!isAdmin) {
              toast.error('Only Administrators are authorized to view security logs');
              return;
            }
            setReauthAction('audit');
            setShowPasswordConfirmModal(true);
          }}
          className="w-full py-3.5 px-4 rounded-2xl border border-border-muted/50 dark:border-white/5 text-text-primary hover:bg-bg-primary transition text-left text-sm font-bold flex items-center justify-between"
        >
          <span className="flex items-center gap-2">📋 View System Security Audit Logs <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-500/20">🔒 Admin Restricted</span></span>
          <span className="material-symbols-outlined text-[18px] opacity-50">arrow_forward</span>
        </button>
      </div>

      {/* Archive / Restore Facility - Admin Only */}
      {isAdmin && (
        facility?.isActive !== false ? (
          <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 mt-6 animate-fade-in">
            <h4 className="font-bold text-rose-500 text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">warning</span> Archive Facility
            </h4>
            <p className="text-xs text-text-secondary mt-1.5">This will temporarily deactivate your facility configuration and restrict all staff members from logging into the system. No data will be lost, and administrators can undo this action later.</p>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider mt-4 transition-all duration-200"
            >
              Archive Facility Configuration
            </button>
          </div>
        ) : (
          <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mt-6 animate-fade-in">
            <h4 className="font-bold text-emerald-500 text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> Restore Facility
            </h4>
            <p className="text-xs text-text-secondary mt-1.5">This facility is currently archived. Staff access is blocked. Click the button below to re-enable access for all staff members.</p>
            <button
              onClick={handleRestoreInitiate}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider mt-4 transition-all duration-200"
            >
              Restore Facility Configuration
            </button>
          </div>
        )
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-secondary rounded-3xl border border-border-muted/50 dark:border-white/5 p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-text-primary mb-2">Confirm Facility Archival</h3>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Archiving will block all staff logins temporarily. To proceed, please type <strong className="text-rose-500">"{currentFacilityName}"</strong> below:
            </p>
            <input
              type="text"
              value={confirmArchive}
              onChange={(e) => setConfirmArchive(e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 px-4 text-text-primary text-sm focus:outline-none mb-5"
              placeholder="Confirm Facility Name"
            />
            <div className="flex gap-3">
              <button
                onClick={handleArchiveInitiate}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest transition-all duration-200"
              >
                Confirm Archive
              </button>
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setConfirmArchive('');
                }}
                className="px-4 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-widest transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-secondary rounded-3xl border border-border-muted/50 dark:border-white/5 p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-rose-500 mb-2">Confirm Queue Reset</h3>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              This action will **permanently delete** all patient waiting, in-progress, and completed queue records for today, and reset the token sequence back to 1.
              <br /><br />
              To proceed, please type <strong className="text-rose-500">"RESET"</strong> in uppercase below:
            </p>
            <input
              type="text"
              value={confirmReset}
              onChange={(e) => setConfirmReset(e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 px-4 text-text-primary text-sm focus:outline-none mb-5"
              placeholder="Type RESET"
            />
            <div className="flex gap-3">
              <button
                onClick={handleResetInitiate}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest transition-all duration-200"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmReset('');
                }}
                className="px-4 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-widest transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Queue Data */}
      <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20">
        <h4 className="font-bold text-rose-500 text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">delete_forever</span> Reset Daily Counter
        </h4>
        <p className="text-xs text-text-secondary mt-1.5">This will clear today's active waiting tickets index and flush the current queue log. Cannot be undone.</p>
        <button
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider mt-4 transition"
        >
          Reset Today's Queue Logs
        </button>
      </div>
    </div>
  );
};
