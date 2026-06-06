import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { FACILITY_TYPES } from '../../../utils/facilityTypeConfig'; 
import { useAuthStore } from '../../../store/authStore';
import { useFacilityStore } from '../../../store/facilityStore';
import toast from 'react-hot-toast';
import { CheckCircle2, UserPlus, Sparkles, Building2, Eye, EyeOff } from 'lucide-react';

// Fallback if FACILITY_TYPES is not defined
const fallbackConfig = {
    clinic: { icon: '🏥', label: 'Clinic' },
    hospital: { icon: '🏢', label: 'Hospital' },
    pathlab: { icon: '🔬', label: 'Pathology Lab' },
    dental: { icon: '🦷', label: 'Dental Clinic' },
    physio: { icon: '🏃', label: 'Physiotherapy' },
    other: { icon: '🏥', label: 'Clinic/Other' }
};

// Helper to convert string to PascalCase (first letter of each word capitalized)
const toPascalCase = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const OnboardingWizard = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [facilityType, setFacilityType] = useState('clinic');
    const [staffName, setStaffName] = useState('');
    const [staffPhone, setStaffPhone] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [staffPassword, setStaffPassword] = useState('');
    const [addDummyPatient, setAddDummyPatient] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const configToUse = FACILITY_TYPES || fallbackConfig;

    const handlePhoneChange = (val) => {
        let numbers = val.replace(/\D/g, "");
        if (numbers.length > 10) {
            numbers = numbers.slice(-10);
        }
        let formatted = numbers;
        if (numbers.length > 5) {
            formatted = `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
        }
        setStaffPhone(formatted);
    };

    const nextStep = async () => {
        setLoading(true);
        try {
            if (step === 1) {
                // PATCH Step 1 - Facility Type Selection
                const res = await api.patch('/facility/onboarding', { 
                    step: 2, 
                    facilityType 
                });

                if (res.data.success) {
                    // Update frontend stores
                    const { accessToken } = res.data;
                    if (accessToken) {
                        useAuthStore.getState().setToken(accessToken);
                    }
                    useFacilityStore.getState().setFacilityType(facilityType);
                    
                    setStep(2);
                    toast.success("Facility customized successfully!");
                }
            } else if (step === 2) {
                // Validation for Step 2
                if (!staffName.trim()) {
                    setLoading(false);
                    return toast.error("Receptionist Name is required");
                }
                const formattedPhone = `+91 ${staffPhone}`;
                if (staffPhone.replace(/\D/g, '').length !== 10) {
                    setLoading(false);
                    return toast.error("Please enter a valid 10-digit phone number");
                }
                if (!staffEmail.trim() || !/\S+@\S+\.\S+/.test(staffEmail)) {
                    setLoading(false);
                    return toast.error("Please enter a valid email address");
                }
                if (staffPassword.length < 6) {
                    setLoading(false);
                    return toast.error("Password must be at least 6 characters");
                }

                // PATCH Step 2 - Create Receptionist User
                const res = await api.patch('/facility/onboarding', {
                    step: 3,
                    staffName: staffName.trim(),
                    staffPhone: formattedPhone,
                    staffEmail: staffEmail.trim(),
                    staffPassword
                });

                if (res.data.success) {
                    setStep(3);
                    toast.success("Staff credential created successfully!");
                }
            } else if (step === 3) {
                // PATCH Step 3 - Finalize
                const res = await api.patch('/facility/onboarding', {
                    step: 3,
                    addDummyPatient
                });

                if (res.data.success) {
                    toast.success(addDummyPatient 
                        ? "Onboarding completed. Dummy patient added!" 
                        : "Onboarding completed!"
                    );
                    onComplete(); // Close Wizard
                }
            }
        } catch (error) {
            console.error("Onboarding step transition error:", error);
            toast.error(error.response?.data?.message || "Failed to proceed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-2xl bg-bg-secondary border border-border-muted/60 dark:border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300"
                >
                    {/* Glowing Accent Orbs */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Progress Bar */}
                    <div className="flex gap-3 mb-8 relative z-10">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1">
                                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                                    s <= step ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`} />
                                <span className={`text-[10px] font-black uppercase tracking-wider block mt-2 text-center transition-colors duration-300 ${
                                    s === step ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-text-secondary/60'
                                }`}>
                                    Step {s}
                                </span>
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="min-h-[350px] flex flex-col justify-between relative z-10"
                        >
                            {step === 1 && (
                                <div className="space-y-6 text-text-primary">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center border border-blue-500/20">
                                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-wider">Setup Your Space</h2>
                                            <p className="text-text-secondary text-xs mt-0.5">Let's customize QueueMD for your facility type.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                                        {Object.keys(configToUse).map((type) => (
                                            <button 
                                                key={type}
                                                onClick={() => setFacilityType(type)}
                                                className={`p-5 rounded-2xl border transition-all text-left flex flex-col items-start gap-3 relative ${
                                                    facilityType === type 
                                                    ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                                                    : 'border-border-muted/60 dark:border-white/5 bg-bg-primary hover:bg-surface-variant/40 hover:border-border-muted'
                                                }`}
                                            >
                                                <span className="text-3xl">{configToUse[type].icon}</span>
                                                <p className="font-black uppercase tracking-wider text-xs text-text-primary">{configToUse[type].label}</p>
                                                {facilityType === type && (
                                                    <span className="absolute top-3 right-3 text-blue-400">
                                                        <CheckCircle2 className="w-5 h-5 fill-blue-500/10 dark:fill-blue-900/40" />
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5 text-text-primary">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                            <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-wider">Add Your First Staff</h2>
                                            <p className="text-text-secondary text-xs mt-0.5">Who will be managing the waiting queue today?</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Receptionist Name (e.g. Priya)" 
                                                value={staffName}
                                                onChange={e => setStaffName(toPascalCase(e.target.value))}
                                                className="w-full p-4 bg-bg-primary border border-border-muted/60 dark:border-white/5 rounded-xl outline-none focus:border-blue-500 text-text-primary placeholder-text-secondary/45 font-semibold transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Phone Number</label>
                                            <div className="flex rounded-xl overflow-hidden bg-bg-primary border border-border-muted/60 dark:border-white/5 focus-within:border-blue-500 transition-all">
                                                <span className="inline-flex items-center px-4 bg-surface-variant/50 border-r border-border-muted/60 dark:border-white/5 text-text-secondary font-bold text-sm">
                                                    +91
                                                </span>
                                                <input 
                                                    type="tel" 
                                                    placeholder="10 digits" 
                                                    value={staffPhone}
                                                    onChange={e => handlePhoneChange(e.target.value)}
                                                    className="flex-1 p-4 bg-transparent outline-none text-text-primary placeholder-text-secondary/45 font-semibold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Email Address</label>
                                            <input 
                                                type="email" 
                                                placeholder="priya@clinic.com" 
                                                value={staffEmail}
                                                onChange={e => setStaffEmail(e.target.value)}
                                                className="w-full p-4 bg-bg-primary border border-border-muted/60 dark:border-white/5 rounded-xl outline-none focus:border-blue-500 text-text-primary placeholder-text-secondary/45 font-semibold transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Receptionist Password</label>
                                            <div className="relative">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder="••••••" 
                                                    value={staffPassword}
                                                    onChange={e => setStaffPassword(e.target.value)}
                                                    className="w-full p-4 pr-12 bg-bg-primary border border-border-muted/60 dark:border-white/5 rounded-xl outline-none focus:border-blue-500 text-text-primary placeholder-text-secondary/45 font-semibold transition-all" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 text-text-primary text-center flex flex-col items-center justify-center py-6">
                                    <div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] mb-2 animate-bounce">
                                        <Sparkles className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black uppercase tracking-wider">You're Ready!</h2>
                                        <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
                                            Your digital waiting room has been configured successfully.
                                        </p>
                                    </div>

                                    <label className="flex items-center gap-3 bg-bg-primary p-4 rounded-xl border border-border-muted/60 dark:border-white/5 cursor-pointer select-none max-w-sm mt-4 hover:border-border-muted transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={addDummyPatient} 
                                            onChange={e => setAddDummyPatient(e.target.checked)} 
                                            className="w-5 h-5 rounded border-border-muted bg-bg-secondary text-blue-500 focus:ring-blue-500/30"
                                        />
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Add dummy patient</p>
                                            <p className="text-[10px] text-text-secondary font-semibold leading-normal mt-0.5">Adds "Rahul Sharma" to your waiting list to verify queue actions immediately.</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-8 border-t border-border-muted/60 dark:border-white/5 pt-6">
                                <span className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">
                                    QueueMD Onboarding
                                </span>
                                <button 
                                    onClick={nextStep}
                                    disabled={loading}
                                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? 'Processing...' : step === 3 ? 'Launch Dashboard 🚀' : 'Next Step →'}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingWizard;
