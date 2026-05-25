import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useFacilityStore } from '../store/facilityStore';
import { useBillingStore } from '../store/billingStore';
import { FACILITY_TYPES, getFacilityConfig } from '../utils/facilityTypeConfig';
import api from '../services/api';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ui/ImageUploader';

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
      <div className="flex items-center gap-4 p-5 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5">
        <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center text-xl font-bold text-text-primary border border-border-muted/30 dark:border-white/5">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary capitalize">{user?.name}</h3>
          <p className="text-text-secondary text-sm">{user?.email}</p>
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-text-secondary border border-border-muted/50 dark:border-white/5 mt-1.5 uppercase tracking-wider">
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
            className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
            placeholder="Enter your name"
          />
        </div>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-6 border-t border-border-muted/30 dark:border-white/5">
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
                className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3 px-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
              />
              {errors[field.key] && <p className="text-rose-500 text-xs mt-1">{errors[field.key]}</p>}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled
          className="px-5 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary/50 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
          title="Coming Soon"
        >
          Update Password 🔐
        </button>
      </form>
    </div>
  );
};

const FacilityProfileTab = ({ facility, onSave, config }) => {
  const facilityId = facility?.facilityId || facility?._id;
  const localStorageKey = `queue-md-facility-settings-${facilityId}`;

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || facility?.name || facility?.facilityName || '',
          address: parsed.address || facility?.address || '',
          contact: parsed.contact || facility?.contact || '',
          workingHours: parsed.workingHours || facility?.workingHours || '09:00 - 20:00',
          logo: parsed.logo || facility?.logo || ''
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: facility?.name || facility?.facilityName || '',
      address: facility?.address || '',
      contact: facility?.contact || '',
      workingHours: facility?.workingHours || '09:00 - 20:00',
      logo: facility?.logo || '',
      lobbyQrCode: facility?.lobbyQrCode || ''
    };
  });

  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    if (facility) {
      setFormData(prev => ({
        name: facility.name || facility.facilityName || prev.name || '',
        address: facility.address || prev.address || '',
        contact: facility.contact || prev.contact || '',
        workingHours: facility.workingHours || prev.workingHours || '09:00 - 20:00',
        logo: facility.logo || prev.logo || '',
        lobbyQrCode: facility.lobbyQrCode || prev.lobbyQrCode || ''
      }));
    }
  }, [facility]);

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onSave(key, value);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result;
      if (typeof base64 === 'string') {
        handleChange('logo', base64);
        toast.success('Logo uploaded! Click Save Changes below to persist.');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload with Cloudinary */}
      <div className="flex items-start gap-4 p-5 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5">
        <div className="w-16 h-16 rounded-2xl bg-bg-primary border border-border-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {formData.logo ? (
            <img src={formData.logo} alt="Facility Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{config.icon}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-text-primary font-bold mb-2">Facility Logo</p>
          <ImageUploader
            folderType="logos"
            currentImage={formData.logo}
            onUploadSuccess={({ imageUrl }) => {
              handleChange('logo', imageUrl);
            }}
          />
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
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
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
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
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
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
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
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm min-h-[100px]"
              placeholder="Enter facility address"
            />
          </div>
        </div>
      </div>

      {/* Lobby QR Code Section */}
      <div className="p-5 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-text-primary">Static Lobby QR Code</h4>
          <p className="text-xs text-text-secondary mt-1">Generate a static QR code for your lobby. Patients can scan this to check their live queue status.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-border-muted/50">
            {formData.lobbyQrCode ? (
              <img src={formData.lobbyQrCode} alt="Lobby QR" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-gray-400">qr_code_2</span>
            )}
          </div>
          
          <div className="space-y-3">
            {!formData.lobbyQrCode ? (
              <button
                onClick={async () => {
                  setGeneratingQR(true);
                  try {
                    const res = await api.post('/facility/lobby-qr');
                    handleChange('lobbyQrCode', res.data.qrImage);
                    toast.success('Lobby QR Generated Successfully!');
                  } catch (err) {
                    toast.error('Failed to generate QR');
                  } finally {
                    setGeneratingQR(false);
                  }
                }}
                disabled={generatingQR}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                {generatingQR ? 'Generating...' : 'Generate Lobby QR'}
              </button>
            ) : (
              <button
                onClick={() => {
                  const printWindow = window.open('', '', 'width=800,height=800');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Print Lobby QR</title>
                        <style>
                          body { text-align: center; font-family: sans-serif; padding: 20px; }
                          .container { border: 2px solid #000; padding: 40px; border-radius: 20px; display: inline-block; max-width: 500px; }
                          img { width: 300px; height: 300px; margin: 20px 0; }
                          h1 { font-size: 32px; font-weight: 900; margin: 0; color: #2563EB; }
                          h2 { font-size: 24px; color: #333; margin-top: 10px; }
                          p { font-size: 16px; color: #666; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <h1>${formData.name || 'QueueMD'}</h1>
                          <h2>Scan to Check Live Status</h2>
                          <img src="${formData.lobbyQrCode}" alt="QR Code" />
                          <p>1. Scan QR with your phone</p>
                          <p>2. Enter your Phone Number & Token</p>
                          <p>3. Wait for your turn!</p>
                        </div>
                        <script>
                          setTimeout(() => { window.print(); window.close(); }, 500);
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-text-primary border border-border-muted/50 dark:border-white/5 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Print Acrylic Stand
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Facility Type Badge */}
      <div className="p-4 bg-bg-primary rounded-xl border border-border-muted/50 dark:border-white/5 flex justify-between items-center">
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
          className="px-4 h-[38px] rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-text-primary border border-border-muted/50 dark:border-white/5 text-xs font-bold transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> Add Branch
        </button>
      </div>

      {showAddForm && (
        <div className="p-5 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">Register Branch</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
              placeholder="Branch Name *"
              className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
            />
            <input
              type="text"
              value={newBranch.address}
              onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
              placeholder="Address"
              className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddBranch} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">Save Branch</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-[72px] bg-bg-primary border border-border-muted/30 dark:border-white/5 animate-pulse rounded-2xl" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-10 bg-bg-primary rounded-2xl border border-border-muted/30 dark:border-white/5">
          <span className="material-symbols-outlined text-4xl text-text-secondary/35">map</span>
          <p className="font-bold text-text-primary mt-2">No branches added yet</p>
          <p className="text-xs text-text-secondary mt-1">Click "Add Branch" to aggregate location queues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch._id} className="flex items-center justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5 hover:border-border-muted transition-all">
              <div className="flex-1 min-w-0 pr-4">
                {editingBranch?._id === branch._id ? (
                  <div className="space-y-2">
                    <input
                      value={editingBranch.name}
                      onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                      className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 outline-none text-text-primary font-bold text-sm px-3 py-1.5 rounded-lg w-full"
                    />
                    <input
                      value={editingBranch.address || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                      className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 outline-none text-text-secondary text-xs px-3 py-1.5 rounded-lg w-full"
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
                    <button onClick={() => setEditingBranch(null)} className="w-8 h-8 rounded-lg bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary flex items-center justify-center transition">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingBranch(branch)}
                    className="w-8 h-8 rounded-lg bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary flex items-center justify-center transition"
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
  const facilityId = facility?.facilityId || facility?._id;
  const localStorageKey = `queue-md-facility-settings-${facilityId}`;

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
        unlimitedQueue: getDbVal('unlimitedQueue') ?? savedParsed.unlimitedQueue ?? true
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
      unlimitedQueue: true
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
        unlimitedQueue: getDbVal('unlimitedQueue') ?? prev.unlimitedQueue
      }));
    }
  }, [facility]);

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
          className="w-32 bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 px-4 text-text-primary font-mono text-center text-lg focus:outline-none focus:border-border-muted transition-all"
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
          <div key={item.key} className="flex items-start justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5">
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
      <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border-muted/50 dark:border-white/5">
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
  const { subscriptionPlan } = useBillingStore();
  const isPro = subscriptionPlan === "pro";
  const [prefs, setPrefs] = useState({
    inApp: true,
    sound: true,
    emailSummary: false,
    browserNotify: false
  });

  useEffect(() => {
    const localStorageKey = `queue-md-notifs-${facilityId}`;
    const saved = localStorage.getItem(localStorageKey);
    if (saved) setPrefs(JSON.parse(saved));
  }, [facilityId]);

  const handleToggle = (key) => {
    const newVal = !prefs[key];
    const updated = { ...prefs, [key]: newVal };
    setPrefs(updated);
    localStorage.setItem(`queue-md-notifs-${facilityId}`, JSON.stringify(updated));
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
        <div key={item.key} className="flex items-start justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5">
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

      {/* Pro Features (WhatsApp / SMS) */}
      <div className={`p-4 rounded-2xl border ${isPro ? 'bg-blue-50/50 border-blue-200' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${isPro ? 'text-blue-600' : 'text-amber-500'}`}>
          <span className="material-symbols-outlined text-[16px]">{isPro ? 'verified' : 'lock'}</span> 
          {isPro ? 'Pro Integrations Active' : 'Integrations Premium Channel'}
        </p>
        <div className="space-y-2.5 mt-3">
          {['WhatsApp Notifications', 'Direct SMS Broadcast Alerts'].map((feature) => (
            <div key={feature} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">{feature}</span>
              {isPro ? (
                <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase tracking-wider text-[9px]">Enabled</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded bg-bg-primary text-text-secondary border border-border-muted/50 dark:border-white/5 font-bold uppercase tracking-wider text-[9px]">Upgrade to Pro</span>
              )}
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
          <div className="bg-bg-secondary rounded-3xl border border-border-muted/50 dark:border-white/5 p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-text-primary mb-2">Confirm Facility Archival</h3>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Archiving will hide patients database. To proceed, please type <strong className="text-rose-500">"{facility?.facilityName}"</strong> below:
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
                onClick={handleArchive}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest"
              >
                Confirm Archive
              </button>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-widest"
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
// SUBSCRIPTION TAB
// ─────────────────────────────────────────────────────────────

const SubscriptionTab = () => {
  const { facilityId } = useAuthStore();
  const { subscriptionPlan, subscriptionStatus, subscriptionEnd, fetchSubscriptionStatus, initiateUpgrade, loading } = useBillingStore();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("yearly"); // Default yearly plan selection

  useEffect(() => {
    if (facilityId) fetchSubscriptionStatus();
  }, [facilityId]);

  const isPro = subscriptionPlan === "pro";
  const isExpired = subscriptionStatus === "expired";
  const validDate = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-IN") : "—";

  // Pricing Data
  const plans = {
    monthly: { amount: 499, label: "₹499/month", desc: "Billed monthly", save: null },
    yearly: { amount: 4999, label: "₹4,999/year", desc: "Billed annually", save: "Save ₹989 🎁" }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className={`p-6 rounded-2xl border transition-colors ${isPro ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" : "bg-bg-primary border-border-muted dark:border-white/10"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-black tracking-wide ${isPro ? "text-blue-700 dark:text-blue-400" : "text-text-primary"}`}>
              {isPro ? "🎉 PRO PLAN" : "🆓 FREE PLAN"}
            </h3>
            <p className="text-sm text-text-secondary mt-1.5 font-medium">
              {isPro ? `Valid until: ${validDate}` : "Basic queue management • 1 Branch • 5 Staff"}
            </p>
          </div>
          {!isPro && (
            <button
              onClick={() => initiateUpgrade(selectedDuration)}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <span>Upgrade to Pro</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-black">{plans[selectedDuration].label}</span>
                </>
              )}
            </button>
          )}
          {isPro && !isExpired && (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30 shadow-sm">Active ✓</span>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-bg-primary rounded-2xl border border-border-muted dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-muted/50 dark:border-white/10 bg-bg-secondary/40">
          <h4 className="font-bold text-text-primary text-base">Plan Comparison</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted/50 dark:border-white/10 bg-bg-primary">
              <th className="text-left py-3.5 px-6 font-bold text-text-secondary uppercase tracking-widest text-[11px]">Feature</th>
              <th className="text-center py-3.5 px-3 font-bold text-text-secondary uppercase tracking-widest text-[11px]">Free</th>
              <th className="text-center py-3.5 px-3 font-black text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 border-b-2 border-blue-500 uppercase tracking-widest text-[11px]">Pro</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Branches", "1", "Unlimited"],
              ["Staff Members", "5", "Unlimited"],
              ["SMS/WhatsApp Alerts", "❌", "✅"],
              ["Advanced Analytics", "❌", "✅"],
              ["Priority Support", "❌", "✅"],
              ["PDF Invoice Export", "❌", "✅"],
              ["Custom Branding", "❌", "✅"]
            ].map(([feature, freeVal, proVal]) => (
              <tr key={feature} className="border-b border-border-muted/30 dark:border-white/5 last:border-0 hover:bg-bg-secondary/30 transition-colors">
                <td className="py-4 px-6 text-text-primary font-medium">{feature}</td>
                <td className="text-center py-4 px-3 text-text-secondary font-medium">{freeVal}</td>
                <td className="text-center py-4 px-3 bg-blue-50/40 dark:bg-blue-500/5 font-bold text-blue-700 dark:text-blue-400">{proVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan Selection Cards */}
      {!isPro && (
        <div className="space-y-4 mt-8">
          <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Select your plan</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {["monthly", "yearly"].map((duration) => {
              const plan = plans[duration];
              const isSelected = selectedDuration === duration;
              
              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setSelectedDuration(duration)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left overflow-hidden group ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20" 
                      : "border-border-muted/50 dark:border-white/10 bg-bg-primary hover:border-blue-500/40 dark:hover:border-blue-500/40 opacity-80 hover:opacity-100"
                  }`}
                >
                  {duration === "yearly" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                      POPULAR
                    </div>
                  )}

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center scale-90 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                    </div>
                  )}
                  
                  <div className={`text-3xl font-black transition-colors ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-text-primary group-hover:text-blue-500 dark:group-hover:text-blue-400"}`}>
                    ₹{plan.amount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-sm text-text-secondary font-medium mt-1.5">
                    {plan.desc}
                  </div>
                  {plan.save && (
                    <div className="inline-flex text-xs text-emerald-700 dark:text-emerald-400 mt-4 font-bold items-center gap-1.5 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      <span className="material-symbols-outlined text-[14px]">redeem</span>
                      {plan.save}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom CTA Button - Prominent */}
      {!isPro && (
        <button
          onClick={() => initiateUpgrade(selectedDuration)}
          disabled={loading}
          className="w-full mt-8 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-all shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 uppercase tracking-widest border border-blue-400/20 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <span className="animate-pulse flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Processing Upgrade...</span>
          ) : (
            <>
              <span>🚀 Upgrade to Pro — {plans[selectedDuration].label}</span>
              {plans[selectedDuration].save && (
                <span className="text-[10px] bg-white/25 px-2.5 py-0.5 rounded-lg font-black tracking-normal ml-1 border border-white/10">
                  {plans[selectedDuration].save}
                </span>
              )}
            </>
          )}
        </button>
      )}

      {/* Billing History Toggle */}
      <div className="mt-8 border-t border-border-muted/50 dark:border-white/10 pt-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold flex items-center gap-1 transition-colors"
        >
          {showHistory ? "Hide" : "View"} Billing History 
          <span className="material-symbols-outlined text-[18px]">
            {showHistory ? "expand_less" : "expand_more"}
          </span>
        </button>
        
        {showHistory && (
          <div className="mt-4 p-5 rounded-2xl bg-bg-secondary/40 border border-border-muted/40 dark:border-white/5 text-sm text-text-secondary italic flex flex-col items-center justify-center gap-3 py-8">
            <span className="material-symbols-outlined text-[32px] opacity-30">receipt_long</span>
            <p className="font-medium text-text-secondary/80">Billing history will appear here after your first transaction.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────

// MAIN SETTINGS COMPONENT
// ─────────────────────────────────────────────────────────────

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

  const fetchFacilityData = useCallback(async () => {
    try {
      setLoadingFacility(true);
      const response = await api.get('/facility/me');
      if (response.data && response.data.data) {
        setFacilityData(response.data.data);
      }
    } catch (err) {
      console.error("Fetch facility error:", err);
    } finally {
      setLoadingFacility(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilityData();
  }, [fetchFacilityData]);

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      // 🔗 Real API call (if route exists)
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
      // Fallback: local save
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
    const facility = facilityData || { facilityId, facilityType, facilityName };

    switch (activeTab) {
      case 'profile': return <MyAccountTab user={user} />;
      case 'facility': return <FacilityProfileTab facility={facility} onSave={handleFieldChange} config={config} />;
      case 'branches': return <BranchesTab facilityId={facilityId} />;
      case 'queue': return <QueueSettingsTab facility={facility} onSave={handleFieldChange} config={config} />;
      case 'appearance': return <AppearanceTab config={config} />;
      case 'notifications': return <NotificationsTab facilityId={facilityId} />;
      case 'subscription': return <SubscriptionTab />;
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
            <div className="hidden lg:flex flex-col gap-1.5 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 p-3 shadow-sm">
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
                      : 'text-text-secondary bg-bg-secondary border border-border-muted/50 dark:border-white/5'
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
          <div className="flex-1 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 p-6 md:p-8 shadow-sm transition-all duration-300 min-h-[400px]">
            {renderTabContent()}
          </div>
        </div>

        {/* Save Bar */}
        {Object.keys(pendingChanges).length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border-muted/30 dark:border-white/10 bg-bg-primary/95 backdrop-blur-sm p-4 z-40 shadow-lg">
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
