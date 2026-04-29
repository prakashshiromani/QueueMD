console.log('Settings.jsx File Loaded at top level');
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Building2, Building, Settings2, CreditCard, Upload, Trash2, Check, X, 
  Shield, Clock, Users, TrendingUp, ChevronDown, Save, RotateCcw, Bell, 
  MessageSquare, Globe, CheckCircle2, Lock, Zap 
} from 'lucide-react';

// 🧠 ZUSTAND MOCK (Replace with actual store in production)
// import { useFacilityStore } from '../store/facilityStore';
// const { facilityType, setFacilityType, updateFacility } = useFacilityStore();

const FACILITY_TYPES = [
  { value: 'clinic', label: '🏥 Clinic' },
  { value: 'pathlab', label: '🔬 Pathlab' },
  { value: 'dental', label: '🦷 Dental Clinic' },
  { value: 'physio', label: '💪 Physiotherapy' }
];

// 🎨 Design System Constants (Matches design.md exactly)
const THEME = {
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  borderMuted: '#334155',
  accentBlue: '#2563EB',
  accentGreen: '#10B981',
  glassInput: 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner',
};

export default function SettingsPage() {
  console.log('SettingsPage Component Rendering');
  // 🔄 Tab State
  const [activeTab, setActiveTab] = useState('management');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    console.log('SettingsPage Mounted');
  }, []);

  // 📦 Form State (Would be synced with Zustand/Backend)
  const [facility, setFacility] = useState({
    name: '',
    id: 'FAC-8821-X',
    type: 'clinic',
    address: '',
    contact: '',
    email: '',
    hours: '',
    logoUrl: null,
    tokenPrefix: 'TKN',
    autoReset: true,
    notificationTemplate: 'Token #{token} abhi call hoga',
    subscriptionPlan: 'free'
  });

  // 🖼 Logo Upload Handler
  const handleLogoUpload = () => {
    // Integrate with Cloudinary/AWS S3 here
    console.log('Logo upload triggered');
  };

  // 💾 Save Handler
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('✅ Settings saved successfully!');
      // API Call: await api.put('/api/facility/update', facility);
    }, 800);
  };

  // 🎛 Tabs Configuration
  const tabs = [
    { id: 'management', label: 'Facility Management', icon: Building2 },
    { id: 'profile', label: 'Facility Profile', icon: Building },
    { id: 'clinic', label: 'Clinic Settings', icon: Settings2 },
    { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard }
  ];

  // 🔥 Render Active Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'management':
        return <FacilityManagementTab facility={facility} />;
      case 'profile':
        return <FacilityProfileTab facility={facility} setFacility={setFacility} handleLogoUpload={handleLogoUpload} />;
      case 'clinic':
        return <ClinicSettingsTab facility={facility} setFacility={setFacility} />;
      case 'subscription':
        return <SubscriptionTab facility={facility} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0F172A] p-4 md:p-6 lg:p-8">
        {/* 📄 Page Header */}
        <div className="mb-8">
          <h1 className="text-[28px] md:text-[32px] font-black text-[#F8FAFC] tracking-tight leading-none">
            System Settings
          </h1>
          <p className="text-[14px] text-[#94A3B8] mt-2">
            Configure your facility details, preferences, and security.
          </p>
        </div>

        {/* 📐 Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* 📌 Navigation Sidebar (Vertical Desktop / Horizontal Mobile) */}
          <nav className="lg:w-64 flex flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all whitespace-nowrap lg:whitespace-normal
                  ${activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'}`}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* 📄 Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-2xl p-6 md:p-8">
              {renderTabContent()}
              
              {/* 💾 Global Save Bar */}
              <div className="mt-8 pt-6 border-t border-[#334155]/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[12px] text-[#94A3B8]">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Changes are saved instantly to your facility database.
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-6 h-[44px] rounded-xl bg-[#1E293B] border border-[#334155]/50 text-[#F8FAFC] font-bold text-[14px] hover:bg-[#334155] active:scale-[0.98] transition-all">
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

// =================================================================
// 📦 SUB-COMPONENTS
// =================================================================

function FacilityManagementTab({ facility }) {
  return (
    <div className="space-y-6">
      <h2 className="text-[16px] font-black text-[#F8FAFC] mb-4">Facility Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Status', value: 'Operational', icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Queue Capacity', value: 'Unlimited', icon: Users, color: 'text-blue-400' },
          { label: 'Current Plan', value: 'Free Tier', icon: CreditCard, color: 'text-purple-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#111418] p-4 rounded-xl border border-[#334155]/20 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[#1E293B] ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest">{stat.label}</p>
              <p className="text-[18px] font-black text-[#F8FAFC]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#111418] p-5 rounded-xl border border-[#334155]/20">
        <h3 className="text-[14px] font-black text-[#F8FAFC] mb-3">Quick Management Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-lg bg-[#1E293B] border border-[#334155]/50 text-[#F8FAFC] text-[13px] font-bold hover:bg-[#334155] transition-all">Export Data</button>
          <button className="px-4 py-2 rounded-lg bg-[#1E293B] border border-[#334155]/50 text-[#F8FAFC] text-[13px] font-bold hover:bg-[#334155] transition-all">Audit Logs</button>
          <button className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold hover:bg-red-500/20 transition-all">Archive Facility</button>
        </div>
      </div>
    </div>
  );
}

function FacilityProfileTab({ facility, setFacility, handleLogoUpload }) {
  const InputField = ({ label, name, value, type = 'text', readOnly = false, placeholder = '' }) => (
    <div className="space-y-2">
      <label className="text-[12px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => setFacility(prev => ({ ...prev, [name]: e.target.value }))}
        className={`w-full h-[50px] ${THEME.glassInput} px-4 text-[14px] text-[#F8FAFC] placeholder:text-[#94A3B8]/30 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all ${readOnly ? 'bg-[#111418]/50 cursor-not-allowed opacity-60' : ''}`}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Logo Section */}
      <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-[#334155]/30">
        <div className="w-24 h-24 rounded-2xl bg-[#111418] border border-[#334155]/50 flex items-center justify-center overflow-hidden">
          {facility.logoUrl ? (
            <img src={facility.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-blue-500">CG</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-[16px] font-black text-[#F8FAFC]">Facility Logo</h3>
          <p className="text-[13px] text-[#94A3B8] mb-3">Update your clinic or hospital's branding.</p>
          <div className="flex gap-3">
            <button onClick={handleLogoUpload} className="px-4 py-2 rounded-xl bg-[#1E293B] border border-[#334155]/50 text-[#F8FAFC] text-[13px] font-bold hover:bg-[#334155] active:scale-[0.97] transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload New
            </button>
            <button className="px-4 py-2 rounded-xl text-red-400 text-[13px] font-bold hover:bg-red-500/10 active:scale-[0.97] transition-all flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputField 
          label="Facility Name" 
          name="name" 
          value={facility.name} 
          placeholder="e.g. City General Clinic" 
        />
        <InputField 
          label="Facility ID" 
          name="id" 
          value={facility.id} 
          readOnly 
        />
        
        <div className="space-y-2">
          <label className="text-[12px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Facility Type</label>
          <div className="relative">
            <select
              value={facility.type}
              onChange={(e) => setFacility(prev => ({ ...prev, type: e.target.value }))}
              className="w-full h-[50px] appearance-none bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 pr-10 text-[14px] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            >
              {FACILITY_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#1E293B]">{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>

        <InputField 
          label="Support Email" 
          name="email" 
          value={facility.email} 
          type="email" 
          placeholder="e.g. support@cityclinic.com"
        />
        <InputField 
          label="Phone Number" 
          name="contact" 
          value={facility.contact} 
          placeholder="e.g. +91 98765 43210"
        />
        <InputField 
          label="Working Hours" 
          name="hours" 
          value={facility.hours} 
          placeholder="e.g. Mon - Sat, 09:00 AM - 08:00 PM"
        />
        <div className="md:col-span-2">
          <InputField 
            label="Full Address" 
            name="address" 
            value={facility.address} 
            placeholder="e.g. Sector 12, MG Road, New Delhi, 110001"
          />
        </div>
      </div>
    </div>
  );
}

function ClinicSettingsTab({ facility, setFacility }) {
  const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#111418] border border-[#334155]/20">
      <span className="text-[14px] font-bold text-[#F8FAFC]">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-blue-600' : 'bg-[#334155]'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  const customFieldsMap = {
    clinic: ['Doctor Name', 'Department', 'Visit Type'],
    pathlab: ['Sample ID', 'Test Type', 'Report Status'],
    dental: ['Tooth Number', 'Procedure Type', 'Dentist Name'],
    physio: ['Session Type', 'Body Focus Area', 'Therapist Name']
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[16px] font-black text-[#F8FAFC] mb-4">Token & Queue Logic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Token Prefix</label>
            <input
              value={facility.tokenPrefix}
              placeholder="e.g. TKN, OPD, LAB"
              onChange={(e) => setFacility(prev => ({ ...prev, tokenPrefix: e.target.value.toUpperCase() }))}
              className="w-full h-[50px] bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 text-[14px] text-[#F8FAFC] placeholder:text-[#94A3B8]/30 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-end pb-1">
            <p className="text-[12px] text-[#94A3B8]">
              Prefix will appear before token number (e.g., <span className="text-blue-400 font-mono">TKN-001</span>)
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ToggleSwitch label="Auto-Reset Tokens Daily (00:00)" checked={facility.autoReset} onChange={(v) => setFacility(prev => ({ ...prev, autoReset: v }))} />
        </div>
      </div>

      <div className="pt-6 border-t border-[#334155]/30">
        <h2 className="text-[16px] font-black text-[#F8FAFC] mb-4">Dynamic Custom Fields</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(customFieldsMap[facility.type] || []).map((field, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#111418] border border-[#334155]/20">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[13px] font-bold text-[#F8FAFC]">{field}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-2">These fields will auto-appear in patient entry forms based on facility type.</p>
      </div>

      <div className="pt-6 border-t border-[#334155]/30">
        <h2 className="text-[16px] font-black text-[#F8FAFC] mb-4">Notification Template</h2>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-[#94A3B8]" />
          <textarea
            value={facility.notificationTemplate}
            placeholder="e.g. Token #{token} is now being called. Please proceed to Room 1."
            onChange={(e) => setFacility(prev => ({ ...prev, notificationTemplate: e.target.value }))}
            rows={3}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#F8FAFC] placeholder:text-[#94A3B8]/30 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab({ facility }) {
  const isPro = facility.subscriptionPlan === 'pro';
  
  const FeatureItem = ({ text, included, proOnly }) => (
    <div className="flex items-center gap-3 text-[13px] font-bold">
      {included ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
      <span className={included ? 'text-[#F8FAFC]' : 'text-[#94A3B8] line-through opacity-50'}>{text}</span>
      {proOnly && <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400 uppercase tracking-wider">Pro</span>}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 border ${isPro ? 'border-blue-500/30 bg-blue-600/10' : 'border-[#334155]/50 bg-[#111418]'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-[20px] font-black text-[#F8FAFC]">
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </h3>
            <p className="text-[13px] text-[#94A3B8] mt-1">
              {isPro ? 'Unlimited facilities & advanced analytics' : 'Basic queue management for single facility'}
            </p>
          </div>
          {!isPro && (
            <button className="px-6 h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-[14px] shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center gap-2">
              <Zap className="w-4 h-4" /> Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#111418] p-5 rounded-xl border border-[#334155]/20">
          <h4 className="text-[14px] font-black text-[#F8FAFC] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Included Features
          </h4>
          <div className="space-y-3">
            <FeatureItem text="1 Facility Instance" included={true} />
            <FeatureItem text="Basic Queue Management" included={true} />
            <FeatureItem text="Real-time Sync (Socket.io)" included={true} />
            <FeatureItem text="Email Notifications" included={true} />
            <FeatureItem text="Community Support" included={true} />
          </div>
        </div>

        <div className="bg-[#111418] p-5 rounded-xl border border-[#334155]/20">
          <h4 className="text-[14px] font-black text-[#F8FAFC] mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" /> Pro Features
          </h4>
          <div className="space-y-3">
            <FeatureItem text="Unlimited Facilities" included={isPro} proOnly={true} />
            <FeatureItem text="Advanced Analytics & Reports" included={isPro} proOnly={true} />
            <FeatureItem text="WhatsApp/SMS Integration" included={isPro} proOnly={true} />
            <FeatureItem text="Custom Branding & Domains" included={isPro} proOnly={true} />
            <FeatureItem text="Priority 24/7 Support" included={isPro} proOnly={true} />
          </div>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="bg-[#111418] p-5 rounded-xl border border-[#334155]/20">
        <h4 className="text-[14px] font-black text-[#F8FAFC] mb-4">Monthly Usage</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[12px] font-bold mb-1">
              <span className="text-[#94A3B8]">Patients Processed</span>
              <span className="text-[#F8FAFC]">1,240 / 5,000</span>
            </div>
            <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: '24%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[12px] font-bold mb-1">
              <span className="text-[#94A3B8]">Storage Used</span>
              <span className="text-[#F8FAFC]">45 MB / 512 MB</span>
            </div>
            <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: '9%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
