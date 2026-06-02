import { useState, useEffect } from 'react';
import api, { changePasswordApi } from '../../services/api';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/ui/ImageUploader';
import { useBillingStore } from '../../store/billingStore';

// Helper to convert string to PascalCase (first letter of each word capitalized)
const toPascalCase = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const MyAccountTab = ({ user }) => {
  const [formData, setFormData] = useState({
    displayName: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = () => {
    const errs = {};
    if (!formData.currentPassword) {
      errs.currentPassword = 'Current password is required';
    }
    if (!formData.newPassword) {
      errs.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      errs.newPassword = 'Min 6 characters required';
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      errs.confirmNewPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const response = await changePasswordApi(formData.currentPassword, formData.newPassword);
      if (response.data?.success) {
        toast.success('Password updated successfully! 🔐');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        toast.error(response.data?.message || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating password. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <div className="relative">
                <input
                  type={showPasswords[field.key] ? 'text' : 'password'}
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3 pl-4 pr-11 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPasswords[field.key] ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors[field.key] && <p className="text-rose-500 text-xs mt-1">{errors[field.key]}</p>}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Password 🔐'}
        </button>
      </form>
    </div>
  );
};

export const FacilityProfileTab = ({ facility, onSave, config }) => {
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
    let formattedValue = value;
    if (key === 'name' || key === 'address') {
      formattedValue = toPascalCase(value);
    }
    const updated = { ...formData, [key]: formattedValue };
    setFormData(updated);
    onSave(key, formattedValue);
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
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) handleChange('contact', val);
              }}
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-text-primary focus:outline-none focus:border-border-muted transition-all text-sm"
              placeholder="e.g. 9876543210"
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

export const NotificationsTab = ({ facilityId }) => {
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
            <div className="w-11 h-6 bg-border-muted peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
      ))}

      {/* Pro Features (WhatsApp / SMS) */}
      <div className={`p-4 rounded-2xl border ${isPro ? 'bg-blue-500/5 border-blue-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${isPro ? 'text-blue-500' : 'text-amber-500'}`}>
          <span className="material-symbols-outlined text-[16px]">{isPro ? 'verified' : 'lock'}</span>
          {isPro ? 'Pro Integrations Active' : 'Integrations Premium Channel'}
        </p>
        <div className="space-y-2.5 mt-3">
          {['WhatsApp Notifications', 'Direct SMS Broadcast Alerts'].map((feature) => (
            <div key={feature} className="flex items-center justify-between text-xs">
              <span className="text-text-primary font-medium">{feature}</span>
              {isPro ? (
                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider text-[9px]">Enabled</span>
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
