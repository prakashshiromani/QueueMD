import React, { useState } from 'react';
import { useFacilityStore } from '../store/facilityStore';
import { getFacilityConfig, getNextTokenPrefix } from '../utils/facilityTypeConfig';
import { clsx } from 'clsx';
import PatientHistoryDrawer from './PatientHistoryDrawer';

const QueueList = ({ queue, loading, onComplete }) => {
  const { facilityType } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);

  return (
    <div className="bg-bg-secondary border border-border-muted rounded-xl flex flex-col h-[550px]">
      <div className="p-4 border-b border-border-muted flex justify-between items-center bg-surface-variant/50 rounded-t-xl">
        <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-status-warning">list_alt</span>
          Live Queue
        </h2>
        <span className="text-caption-xs font-label-bold text-text-secondary">{queue.length} Active</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-2">
        {queue.length > 0 ? (
          queue.map((patient, index) => {
            const isInProgress = patient.status === 'in-progress';
            const statusColor = isInProgress ? 'status-warning' : 'status-info';
            
            return (
              <div 
                key={patient._id || index}
                className={clsx(
                  "bg-bg-primary border border-border-muted rounded-lg p-3 flex items-center justify-between hover:bg-surface-variant/50 transition-all hover:translate-x-1 border-l-4",
                  isInProgress ? "border-l-status-warning bg-status-warning/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-l-status-info opacity-80"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "border font-bold px-2 py-1.5 rounded-md flex flex-col items-center justify-center min-w-[60px]",
                    isInProgress ? "bg-status-warning/10 border-status-warning/30 text-status-warning" : "bg-status-info/10 border-status-info/30 text-status-info"
                  )}>
                    <span className="text-[9px] opacity-70 leading-tight">{getNextTokenPrefix(patient.facilityType || facilityType)}</span>
                    <span className="text-[14px] leading-tight">{String(patient.tokenNumber).padStart(3, '0')}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[15px] text-text-primary leading-tight hover:underline cursor-pointer" onClick={() => setViewHistoryPatient({ name: patient.patientName, phone: patient.phone })}>
                        {patient.patientName}
                      </h3>
                      <button 
                        onClick={() => setViewHistoryPatient({ name: patient.patientName, phone: patient.phone })}
                        className="p-1 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center justify-center"
                        title="View Patient History"
                      >
                        <span className="material-symbols-outlined text-[14px]">history</span>
                      </button>
                    </div>
                    {patient.phone && (
                      <p className="text-caption-xs font-body-sm text-text-secondary whitespace-nowrap">{patient.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {isInProgress && (
                      <button 
                        onClick={() => onComplete(patient._id)}
                        className="bg-status-success/20 hover:bg-status-success/30 text-status-success text-[10px] font-label-bold px-2 py-1 rounded border border-status-success/30 flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Mark Complete
                      </button>
                    )}
                    <span className={clsx(
                      "text-[10px] font-label-bold px-2 py-1 rounded uppercase tracking-wider",
                      isInProgress ? "bg-status-warning/20 text-status-warning animate-pulse" : "bg-status-info/20 text-status-info"
                    )}>
                      {isInProgress ? 'In Chair' : 'Waiting'}
                    </span>
                  </div>
                  
                  <div className="flex gap-1 flex-wrap justify-end">
                    {Object.entries(patient.customData || {}).map(([key, val]) => (
                      <span 
                        key={key} 
                        className="text-[10px] font-label-bold px-2 py-0.5 rounded border uppercase"
                        style={config.label === 'Dental' ? {
                          backgroundColor: `${config.theme.primary}33`,
                          color: config.theme.primary,
                          borderColor: `${config.theme.primary}4D`
                        } : {
                          backgroundColor: 'var(--surface-variant)',
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-muted)'
                        }}
                      >
                        {key}: {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-text-secondary">
            <span className="material-symbols-outlined text-[48px] opacity-20 mb-4">group_off</span>
            <p className="font-body-base">No patients waiting</p>
          </div>
        )}
      </div>

      <PatientHistoryDrawer 
        isOpen={!!viewHistoryPatient} 
        onClose={() => setViewHistoryPatient(null)} 
        patient={viewHistoryPatient} 
      />
    </div>
  );
};

export default QueueList;
