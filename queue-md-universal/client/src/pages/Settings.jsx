import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useFacilityStore } from '../store/facilityStore';
import { FACILITY_TYPES, getFacilityConfig } from '../utils/facilityTypeConfig';
import api from '../services/api';
import toast from 'react-hot-toast';

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS (Each Tab)
// ─────────────────────────────────────────────────────────────

const MyAccountTab = ({ user }) => {
  const [formData, setFormData] = useState({
    displayName: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});

  const validatePassword = () => {
    const errs = {};
    if (formData.newPassword && formData.newPassword.length < 6) {
      errs.newPassword = 'Min 6 characters required';
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      errs.confirmNewPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    toast.error('Password update feature coming soon! 🔐');
  };

  return (
    <div className="space-y-6">
      {/* Avatar + Basic Info */}
      <div className="flex items-center gap-4 p-5 bg-bg-secondary rounded-2xl border border-border-muted/50">
        <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center text-xl font-bold text-text-primary border border-border-muted/30">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary capitalize">{user?.name}</h3>
          <p className="text-text-secondary text-sm">{user?.email}</p>
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-text-secondary border border-border-muted/50 mt-1.5 uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Display Name</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">person</span>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
            placeholder="Enter your name"
          />
        </div>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-6 border-t border-border-muted/30">
        <h4 className="font-bold text-text-primary">Change Password</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword', label: 'New Password' },
            { key: 'confirmNewPassword', label: 'Confirm New Password' }
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary capitalize">{field.label}</label>
              <input
                type="password"
                value={formData[field.key]}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3 px-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
              />
              {errors[field.key] && <p className="text-rose-500 text-xs mt-1">{errors[field.key]}</p>}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled
          className="px-5 py-3 rounded-xl bg-bg-primary border border-border-muted/50 text-text-secondary/50 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
          title="Coming Soon"
        >
          Update Password 🔐
        </button>
      </form>
    </div>
  );
};

const FacilityProfileTab = ({ facility, onSave, config }) => {
  const facilityId = facility?.facilityId;
  const localStorageKey = `queue-md-facility-settings-${facilityId}`;

  const [formData, setFormData] = useState(() => {
    // Attempt to load previously saved profile fields
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || facility?.facilityName || '',
          address: parsed.address || '',
          contact: parsed.contact || '',
          workingHours: parsed.workingHours || '09:00 - 20:00'
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: facility?.facilityName || '',
      address: '',
      contact: '',
      workingHours: '09:00 - 20:00'
    };
  });

  useEffect(() => {
    if (facility?.facilityName && !formData.name) {
      setFormData(prev => ({ ...prev, name: facility.facilityName }));
    }
  }, [facility, formData.name]);

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    // Propagate field value up
    onSave(key, value);
  };

  return (
    <div className="space-y-6">
      {/* Logo Placeholder */}
      <div className="flex items-center gap-4 p-5 bg-bg-secondary rounded-2xl border border-border-muted/50">
        <div className="w-16 h-16 rounded-2xl bg-bg-primary border-2 border-dashed border-border-muted/50 flex items-center justify-center">
          <span className="text-3xl">{config.icon}</span>
        </div>
        <div>
          <p className="text-text-primary font-bold">Facility Logo</p>
          <button
            disabled
            className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 mt-1 uppercase tracking-widest font-bold"
            title="Logo upload coming soon"
          >
            Upload Logo 📸
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Facility Name</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">business</span>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
              placeholder="Facility Name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Contact Number</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">phone</span>
            <input
              type="tel"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Working Hours</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">schedule</span>
            <input
              type="text"
              value={formData.workingHours}
              onChange={(e) => handleChange('workingHours', e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
              placeholder="09:00 - 20:00"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Address</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-5 text-text-secondary text-[18px]">location_on</span>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm min-h-[100px]"
              placeholder="Enter facility address"
            />
          </div>
        </div>
      </div>

      {/* Facility Type Badge */}
      <div className="p-4 bg-bg-primary rounded-xl border border-border-muted/50 flex justify-between items-center">
        <div>
          <p className="text-xs text-text-secondary">Facility Configuration Type</p>
          <p className="text-text-primary font-bold flex items-center gap-2 mt-1 capitalize text-sm">
            <span>{config.icon}</span> {config.label}
          </p>
        </div>
        <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">Active System</span>
      </div>
    </div>
  );
};

const BranchesTab = ({ facilityId }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });
  const [editingBranch, setEditingBranch] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/facility/${facilityId}/branches`);
      setBranches(response.data.data || []);
    } catch (err) {
      console.error("Fetch branches error:", err);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId) fetchBranches();
  }, [facilityId, fetchBranches]);

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) return toast.error('Branch name required');
    try {
      await api.post(`/facility/${facilityId}/branch`, newBranch);
      setShowAddForm(false);
      setNewBranch({ name: '', address: '' });
      fetchBranches();
      toast.success('Branch added successfully');
    } catch (err) {
      toast.error('Failed to add branch');
    }
  };

  const handleToggleActive = async (branchId, currentStatus) => {
    try {
      await api.put(`/facility/${facilityId}/branch/${branchId}`, { isActive: !currentStatus });
      fetchBranches();
      toast.success('Branch status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch.name.trim()) return toast.error('Branch name required');
    try {
      await api.put(`/facility/${facilityId}/branch/${editingBranch._id}`, editingBranch);
      setEditingBranch(null);
      fetchBranches();
      toast.success('Branch updated successfully');
    } catch (err) {
      toast.error('Failed to update branch');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Manage Branches</h3>
          <p className="text-xs text-text-secondary mt-1">Configure multi-location branches for this facility</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 h-[38px] rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-text-primary border border-border-muted/50 text-xs font-bold transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> Add Branch
        </button>
      </div>

      {showAddForm && (
        <div className="p-5 bg-bg-primary rounded-2xl border border-border-muted/50 space-y-4">
          <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">Register Branch</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
              placeholder="Branch Name *"
              className="w-full bg-bg-secondary border border-border-muted/50 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
            />
            <input
              type="text"
              value={newBranch.address}
              onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
              placeholder="Address"
              className="w-full bg-bg-secondary border border-border-muted/50 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddBranch} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">Save Branch</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-muted/50 text-text-secondary font-bold text-xs uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-[72px] bg-bg-primary border border-border-muted/30 animate-pulse rounded-2xl" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-10 bg-bg-primary rounded-2xl border border-border-muted/30">
          <span className="material-symbols-outlined text-4xl text-text-secondary/35">map</span>
          <p className="font-bold text-text-primary mt-2">No branches added yet</p>
          <p className="text-xs text-text-secondary mt-1">Click "Add Branch" to aggregate location queues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch._id} className="flex items-center justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50 hover:border-border-muted transition-all">
              <div className="flex-1 min-w-0 pr-4">
                {editingBranch?._id === branch._id ? (
                  <div className="space-y-2">
                    <input
                      value={editingBranch.name}
                      onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                      className="bg-bg-secondary border border-border-muted/50 outline-none text-text-primary font-bold text-sm px-3 py-1.5 rounded-lg w-full"
                    />
                    <input
                      value={editingBranch.address || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                      className="bg-bg-secondary border border-border-muted/50 outline-none text-text-secondary text-xs px-3 py-1.5 rounded-lg w-full"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-text-primary text-sm capitalize">{branch.name}</p>
                    <p className="text-xs text-text-secondary mt-1 truncate">{branch.address || 'No address configured'}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branch.isActive}
                    onChange={() => handleToggleActive(branch._id, branch.isActive)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-border-muted peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all"></div>
                </label>

                {editingBranch?._id === branch._id ? (
                  <div className="flex gap-1.5">
                    <button onClick={handleUpdateBranch} className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <button onClick={() => setEditingBranch(null)} className="w-8 h-8 rounded-lg bg-bg-secondary border border-border-muted/50 text-text-secondary flex items-center justify-center transition">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingBranch(branch)}
                    className="w-8 h-8 rounded-lg bg-bg-secondary border border-border-muted/50 text-text-secondary hover:text-text-primary flex items-center justify-center transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const QueueSettingsTab = ({ facility, onSave, config }) => {
  const facilityId = facility?.facilityId;
  const localStorageKey = `queue-md-facility-settings-${facilityId}`;

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          tokenPrefix: parsed.tokenPrefix || config.tokenPrefix || 'TKN',
          autoReset: parsed.autoReset ?? true,
          baseConsultTime: parsed.baseConsultTime || config.baseConsultTime || 15,
          notificationTemplate: parsed.notificationTemplate || config.notificationTemplate || '',
          maxQueueSize: parsed.maxQueueSize || '',
          unlimitedQueue: parsed.unlimitedQueue ?? true
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      tokenPrefix: config.tokenPrefix || 'TKN',
      autoReset: true,
      baseConsultTime: config.baseConsultTime || 15,
      notificationTemplate: config.notificationTemplate || '',
      maxQueueSize: '',
      unlimitedQueue: true
    };
  });

  const handleChange = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    onSave(key, value);
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
          className="w-32 bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 px-4 text-text-primary font-mono text-center text-lg focus:outline-none focus:border-border-muted transition-all"
          placeholder="TKN"
        />
        <p className="text-xs text-text-secondary mt-1">Generated Token: <code className="bg-bg-primary px-1.5 py-0.5 rounded font-mono text-emerald-500 font-bold">{settings.tokenPrefix}-001</code></p>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        {[
          { key: 'autoReset', label: 'Auto-Reset Tokens Daily', desc: 'Reset token counter to 1 at midnight' },
          { key: 'unlimitedQueue', label: 'Unlimited Queue Capacity', desc: 'Allow patients to join queue without restriction' }
        ].map((item) => (
          <div key={item.key} className="flex items-start justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50">
            <div>
              <p className="font-bold text-text-primary text-sm">{item.label}</p>
              <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={() => handleChange(item.key, !settings[item.key])}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-border-muted peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Consult Time Slider */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Base Consult Time</label>
        <div className="flex items-center gap-4 p-4 bg-bg-primary border border-border-muted/50 rounded-2xl">
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={settings.baseConsultTime}
            onChange={(e) => handleChange('baseConsultTime', parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-border-muted rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-text-primary font-bold text-sm w-20 text-right bg-bg-secondary px-3 py-1.5 rounded-lg border border-border-muted/50">{settings.baseConsultTime} min</span>
        </div>
      </div>

      {/* Notification Template */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">Notification Template</label>
        <textarea
          value={settings.notificationTemplate}
          onChange={(e) => handleChange('notificationTemplate', e.target.value)}
          className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-4 px-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm min-h-[100px]"
          placeholder="Use #{token} for token number"
        />
        <p className="text-xs text-text-secondary mt-1">Syntax variables: <code className="bg-bg-primary px-1.5 py-0.5 rounded font-mono text-[11px]">#{'{token}'}</code> or <code className="bg-bg-primary px-1.5 py-0.5 rounded font-mono text-[11px]">#{'{sampleId}'}</code></p>
      </div>

      {/* Status Flow Preview */}
      <div className="p-4 bg-bg-primary rounded-2xl border border-border-muted/50">
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

const AppearanceTab = ({ config }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#2563EB');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true');

  const colors = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Purple', value: '#7C3AED' },
    { name: 'Green', value: '#10B981' },
    { name: 'Pink', value: '#EC4899' }
  ];

  // Apply font size via data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-container', accentColor);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Apply compact mode via data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-compact', String(compactMode));
    localStorage.setItem('compactMode', String(compactMode));
  }, [compactMode]);

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">
          Theme Mode
        </label>
        <div className="flex gap-3">
          {['light', 'dark'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setTheme(mode);
                toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode enabled`);
              }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                theme === mode
                  ? 'border-primary-container bg-primary-container/10 text-primary font-semibold'
                  : 'border-border-muted text-text-secondary hover:border-border-muted/70'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {mode === 'light' ? 'light_mode' : 'dark_mode'}
              </span>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Accent Color */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">
          Brand Accent Color
        </label>
        <div className="flex gap-3">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                setAccentColor(color.value);
                toast.success(`Accent updated to ${color.name}`);
              }}
              className={`w-12 h-12 rounded-xl border-2 transition transform hover:scale-105 ${
                accentColor === color.value
                  ? 'border-text-primary scale-105 shadow-lg'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {accentColor === color.value && (
                <span className="material-symbols-outlined text-white text-[18px] flex items-center justify-center w-full">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Accessibility Size */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">
          Font Accessibility Size
        </label>
        <div className="flex gap-3">
          {[
            { value: 'small', label: 'Small', icon: 'text_fields', px: '12px' },
            { value: 'medium', label: 'Medium', icon: 'format_size', px: '16px' },
            { value: 'large', label: 'Large', icon: 'text_increase', px: '20px' }
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition flex flex-col items-center justify-center gap-1 ${
                fontSize === size.value
                  ? 'border-primary-container bg-primary-container/10 text-primary font-semibold'
                  : 'border-border-muted text-text-secondary hover:border-border-muted/70'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: size.value === 'small' ? '16px' : size.value === 'large' ? '24px' : '20px' }}
              >
                {size.icon}
              </span>
              <span style={{ fontSize: size.px, fontWeight: fontSize === size.value ? '700' : '400' }}>
                {size.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary">
          Current: <span className="font-semibold text-text-primary">{fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}</span>
          {fontSize === 'small' && ' — Compact view for small screens'}
          {fontSize === 'large' && ' — Accessibility large text mode'}
        </p>
      </div>

      {/* Compact Dashboard View */}
      <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border-muted/50">
        <div>
          <p className="font-medium text-text-primary mb-1">Compact Dashboard View</p>
          <p className="text-sm text-text-secondary">Reduce queue card margins for high-density lists</p>
        </div>
        <button
          role="switch"
          aria-checked={compactMode}
          onClick={() => {
            const next = !compactMode;
            setCompactMode(next);
            toast.success(`Compact mode ${next ? 'enabled' : 'disabled'}`);
          }}
          className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
          style={{
            backgroundColor: compactMode ? 'var(--primary-container)' : 'var(--border-muted)'
          }}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 mt-0.5"
            style={{ transform: compactMode ? 'translateX(20px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-primary-container/10 rounded-xl border border-primary-container/30">
        <p className="text-sm text-text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary-container)' }}>info</span>
          Changes apply immediately across the entire application
        </p>
      </div>
    </div>
  );
};

const NotificationsTab = ({ facilityId }) => {
  const localStorageKey = `queue-md-notification-prefs-${facilityId}`;

  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      inApp: true,
      sound: true,
      emailSummary: false,
      browserNotify: true
    };
  });

  const handleToggle = (key) => {
    const newVal = !prefs[key];
    const updated = { ...prefs, [key]: newVal };
    setPrefs(updated);
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
    toast.success('Notification preferences updated!');
  };

  return (
    <div className="space-y-4">
      {[
        { key: 'inApp', label: 'In-App Alerts', desc: 'Show top banner and dashboard notifications' },
        { key: 'sound', label: 'Sound Chimes', desc: 'Play chime/beep when token is called next' },
        { key: 'emailSummary', label: 'Daily Email Summary', desc: 'Receive queue metrics report daily at 9 PM' },
        { key: 'browserNotify', label: 'Browser Push Notifications', desc: 'Allow system alerts when QueueMD is in the background' }
      ].map((item) => (
        <div key={item.key} className="flex items-start justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50">
          <div>
            <p className="font-bold text-text-primary text-sm">{item.label}</p>
            <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={() => handleToggle(item.key)}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-border-muted peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all"></div>
          </label>
        </div>
      ))}

      {/* Pro Features Locked */}
      <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
        <p className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">lock</span> Integrations Premium Channel
        </p>
        <div className="space-y-2.5 mt-3">
          {['WhatsApp Notifications', 'Direct SMS Broadcast Alerts'].map((feature) => (
            <div key={feature} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">{feature}</span>
              <span className="px-2.5 py-0.5 rounded bg-bg-primary text-text-secondary border border-border-muted/50 font-bold uppercase tracking-wider text-[9px]">Upgrade to Pro</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DangerZoneTab = ({ user, facility }) => {
  const [confirmArchive, setConfirmArchive] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);

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

  const handleArchive = () => {
    if (confirmArchive !== facility?.facilityName) {
      toast.error('Please type facility name correctly to confirm');
      return;
    }
    toast.error('Archive feature is locked/coming soon');
    setShowArchiveModal(false);
    setConfirmArchive('');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Status', value: '🟢 Operational', color: 'text-emerald-500' },
          { label: 'Current Plan', value: facility?.subscriptionPlan === 'pro' ? '💎 Pro Plan' : '🆓 Free Plan', color: 'text-blue-500' },
          { label: 'Today\'s Limit', value: 'Unlimited', color: 'text-text-primary' }
        ].map((card) => (
          <div key={card.label} className="p-4 bg-bg-primary rounded-2xl border border-border-muted/50">
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wide">{card.label}</p>
            <p className={`font-black text-sm mt-1 capitalize ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-3">
        <button
          onClick={handleExport}
          className="w-full py-3.5 px-4 rounded-2xl border border-border-muted/50 text-text-primary hover:bg-bg-primary transition text-left text-sm font-bold flex items-center justify-between"
        >
          <span>📥 Export Facility Database (JSON Format)</span>
          <span className="material-symbols-outlined text-[18px] opacity-50">arrow_forward</span>
        </button>
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-2xl border border-border-muted/20 text-text-secondary/40 cursor-not-allowed text-left text-sm font-bold flex items-center justify-between"
          title="Pro Feature"
        >
          <span>📋 View System Security Audit Logs 🔒</span>
          <span className="material-symbols-outlined text-[18px] opacity-30">lock</span>
        </button>
      </div>

      {/* Archive Facility - Admin Only */}
      {isAdmin && (
        <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 mt-6">
          <h4 className="font-bold text-rose-500 text-sm flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">warning</span> Archive Facility
          </h4>
          <p className="text-xs text-text-secondary mt-1.5">This will deactivate your facility configuration and restrict staff login access. This operation is reversible by administrators.</p>
          <button
            onClick={() => setShowArchiveModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider mt-4"
          >
            Archive Facility Configuration
          </button>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-bg-primary/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary rounded-3xl border border-border-muted/50 p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-text-primary mb-2">Confirm Facility Archival</h3>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Archiving will hide patients database. To proceed, please type <strong className="text-rose-500">"{facility?.facilityName}"</strong> below:
            </p>
            <input
              type="text"
              value={confirmArchive}
              onChange={(e) => setConfirmArchive(e.target.value)}
              className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-3.5 px-4 text-text-primary text-sm focus:outline-none mb-5"
              placeholder="Confirm Facility Name"
            />
            <div className="flex gap-3">
              <button
                onClick={handleArchive}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest"
              >
                Confirm Archive
              </button>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-3 rounded-xl bg-bg-primary border border-border-muted/50 text-text-secondary font-bold text-xs uppercase tracking-widest"
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
          onClick={() => toast.error('Counter reset endpoint coming soon')}
          className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider mt-4 transition"
        >
          Reset Today's Queue Logs
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN SETTINGS COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Settings() {
  const { user } = useAuthStore();
  const { facilityId, facilityType, facilityName, setFacility } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

  const [activeTab, setActiveTab] = useState('facility');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  const tabs = [
    { id: 'profile', label: 'My Account', icon: 'manage_accounts' },
    { id: 'facility', label: 'Facility Profile', icon: 'business' },
    { id: 'branches', label: 'Branches', icon: 'map' },
    { id: 'queue', label: 'Queue & Tokens', icon: 'queue' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'danger', label: 'Danger Zone', icon: 'warning' }
  ];

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      // 🔗 Real API call (if route exists)
      await api.put('/facility/update', {
        facilityId,
        ...pendingChanges
      });

      // Update global facilityName in store if modified
      if (pendingChanges.name) {
        setFacility(facilityId, pendingChanges.name, facilityType);
      }

      // Save locally to simulate persistence for other custom fields
      const localStorageKey = `queue-md-facility-settings-${facilityId}`;
      const existingSettings = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      localStorage.setItem(localStorageKey, JSON.stringify({ ...existingSettings, ...pendingChanges }));

      toast.success('Settings saved successfully! ✅');
      setPendingChanges({});
    } catch (err) {
      // Fallback: local save
      console.log('API not ready or update path not defined, saving locally to context');
      if (pendingChanges.name) {
        setFacility(facilityId, pendingChanges.name, facilityType);
      }
      const localStorageKey = `queue-md-facility-settings-${facilityId}`;
      const existingSettings = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      localStorage.setItem(localStorageKey, JSON.stringify({ ...existingSettings, ...pendingChanges }));

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
    const facility = { facilityId, facilityType, facilityName };

    switch (activeTab) {
      case 'profile': return <MyAccountTab user={user} />;
      case 'facility': return <FacilityProfileTab facility={facility} onSave={handleFieldChange} config={config} />;
      case 'branches': return <BranchesTab facilityId={facilityId} />;
      case 'queue': return <QueueSettingsTab facility={facility} onSave={handleFieldChange} config={config} />;
      case 'appearance': return <AppearanceTab config={config} />;
      case 'notifications': return <NotificationsTab facilityId={facilityId} />;
      case 'danger': return <DangerZoneTab user={user} facility={facility} />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto pb-32 px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.1)`,
              color: config.theme.primary,
              borderColor: `rgba(${primaryRgb}, 0.25)`
            }}
          >
            <span className="material-symbols-outlined text-2xl">settings</span>
          </div>
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">System Settings</h1>
            <p className="text-[14px] text-text-secondary mt-2">Manage your facility configurations and preferences.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            {/* Desktop: Vertical */}
            <div className="hidden lg:flex flex-col gap-1.5 bg-bg-secondary rounded-2xl border border-border-muted/50 p-3 shadow-sm">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-sm font-bold ${isActive
                      ? 'text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary'
                      }`}
                    style={isActive ? {
                      backgroundColor: config.theme.primary,
                      boxShadow: `0 4px 12px rgba(${primaryRgb}, 0.25)`
                    } : {}}
                  >
                    <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                      ? 'text-white'
                      : 'text-text-secondary bg-bg-secondary border border-border-muted/50'
                      }`}
                    style={isActive ? { backgroundColor: config.theme.primary } : {}}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-bg-secondary rounded-2xl border border-border-muted/50 p-6 md:p-8 shadow-sm transition-all duration-300 min-h-[400px]">
            {renderTabContent()}
          </div>
        </div>

        {/* Save Bar */}
        {Object.keys(pendingChanges).length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border-muted/30 bg-bg-primary/95 backdrop-blur-sm p-4 z-40 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
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
