import React, { useState, useEffect } from 'react';
import { useFacilityStore } from '../store/facilityStore';
import { FACILITY_TYPES } from '../utils/facilityTypeConfig';
import { addPatientApi, searchPatientsApi } from '../services/api';

/**
 * AddPatientForm renders universal fields and dynamic custom fields 
 * based on the active facilityType config.
 */
const AddPatientForm = ({ handleAddPatient }) => {
  const { facilityType, setFacilityType } = useFacilityStore();
  const config = FACILITY_TYPES[facilityType] || FACILITY_TYPES.clinic;

  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [visitDate, setVisitDate] = useState('2023-10-24');
  const [visitTime, setVisitTime] = useState('09:00');
  const [status, setStatus] = useState('Active');
  const [customData, setCustomData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setCustomData(facilityType === 'pathlab' ? { sampleId: 'SAM-' } : {});
  }, [facilityType]);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchPatientsApi(query);
      setSuggestions(results);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const selectPatient = (patient) => {
    setPatientName(patient.name);
    setPhone(patient.phone);
    setSuggestions([]);
  };

  const doctors = [
    { id: 'STF-1042', name: 'Dr. Sarah Jenkins' },
    { id: 'STF-2015', name: 'Dr. Michael Chen' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: patientName,
        phone,
        assignedDoctor,
        visitDate,
        visitTime,
        status,
        customData,
        facilityType
      };

      console.log("🚀 [FRONTEND DEBUG] Sending Payload:", payload);

      await handleAddPatient(payload);
      setPatientName('');
      setPhone('');
      setAssignedDoctor('');
      setVisitDate('2023-10-24');
      setVisitTime('09:00');
      setStatus('Active');
      setCustomData({});
    } catch (err) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  const buttonText = `ADD ${config.label === 'Clinic' ? 'PATIENT' : 'SAMPLE'}`;

  return (
    <div className="bg-bg-secondary border border-border-muted rounded-xl flex flex-col h-[550px]">
      <div className="pl-4 pt-4 pb-4 pr-12 border-b border-border-muted flex justify-between items-center bg-surface-variant/50 rounded-t-xl">
        <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-status-info">person_add</span>
          New {config.label === 'Pathlab' ? 'Sample' : 'Patient'} Entry
        </h2>
        <div className="relative mr-8">
          <select 
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value)}
            className="text-caption-xs font-label-bold px-3 py-1.5 rounded border uppercase bg-transparent appearance-none pr-8 cursor-pointer focus:outline-none transition-all"
            style={{ 
              backgroundColor: `${config.theme.primary}33`, 
              color: config.theme.primary,
              borderColor: `${config.theme.primary}4D`,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: 'none'
            }}
          >
            {Object.keys(FACILITY_TYPES).map(type => (
              <option key={type} value={type} className="bg-[#1E293B] text-white uppercase">
                {FACILITY_TYPES[type].label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[16px]" style={{ color: config.theme.primary }}>
            expand_more
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-md text-status-error text-caption-xs font-label-bold flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <form id="add-patient-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">Patient Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">search</span>
              <input
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  handleSearch(e.target.value);
                }}
                required
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-10 pr-3 text-[14px] text-text-primary focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner"
                placeholder="Search or enter name"
              />
            </div>
            
            {/* Search Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-[#1E293B] border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {suggestions.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => selectPatient(p)}
                    className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-[14px] font-bold text-white group-hover:text-status-info transition-colors">{p.name}</p>
                      <p className="text-[11px] text-gray-400">+{p.phone}</p>
                    </div>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">EXISTING</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-white/10 border border-r-0 border-white/10 rounded-l-md text-text-secondary text-[14px]">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-r-md py-2 px-3 text-[14px] text-text-primary focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner"
                placeholder="98765 43210"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">Assign Doctor</label>
            <div className="relative">
              <select
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-3 pr-10 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', backgroundImage: 'none' }}
              >
                <option value="" className="bg-bg-secondary">Select Doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.name} className="bg-bg-secondary">{doc.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary/50">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">Visit Date</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-[14px] text-text-primary focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner"
              />
            </div>
            <div className="space-y-1">
              <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">Visit Time</label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-[14px] text-text-primary focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner"
              />
            </div>
          </div>

              <div className="space-y-1">
                <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">Patient Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-3 pr-10 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', backgroundImage: 'none' }}
                  >
                    <option value="Active" className="bg-bg-secondary">Active</option>
                    <option value="Inactive" className="bg-bg-secondary">Inactive</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary/50">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

          {config.customFields && config.customFields.length > 0 && (
            <div className="pt-4 border-t border-border-muted/50 space-y-4">
              {config.customFields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-caption-xs font-label-bold text-text-secondary uppercase tracking-wider block">{field.label}</label>
                  {field.type === 'select' ? (
                    <div className="relative">
                      <select
                        value={customData[field.name] || ''}
                        onChange={(e) => setCustomData(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-3 pr-10 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner cursor-pointer"
                        required={field.required}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', backgroundImage: 'none' }}
                      >
                        <option value="" className="bg-bg-secondary">Select {field.label}</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt} className="bg-bg-secondary">{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary/50">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={customData[field.name] || ''}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (field.name === "sampleId") {
                          if (!val.startsWith("SAM-")) {
                            if ("SAM-".startsWith(val)) {
                              val = "SAM-";
                            } else {
                              val = "SAM-" + val.replace(/^SAM-?/i, "");
                            }
                          }
                        }
                        setCustomData(prev => ({ ...prev, [field.name]: val }));
                      }}
                      placeholder={field.placeholder || `e.g. ${field.label}`}
                      className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-[14px] text-text-primary focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all backdrop-blur-md shadow-inner"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="p-4 border-t border-border-muted bg-surface-variant/50 rounded-b-xl">
        <button
          form="add-patient-form"
          type="submit"
          disabled={loading}
          className="w-full bg-status-info hover:bg-status-info/90 text-white font-label-bold text-[14px] py-2 px-4 rounded-md transition-all active:translate-y-[1px] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={config.label === 'Dental' ? { backgroundColor: config.theme.primary, color: '#fff' } : {}}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>PROCESSING...</span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined">add</span>
              {buttonText}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddPatientForm;
