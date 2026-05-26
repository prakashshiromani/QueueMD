import React from 'react';
import { useFacilityStore } from '../store/facilityStore';
import { FACILITY_TYPES } from '../utils/facilityTypeConfig';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * FacilitySelector component allows switching facility types instantly.
 * Features a horizontal pill-based switcher.
 */
const FacilitySelector = () => {
  const { facilityType, setFacility, facilityId, facilityName } = useFacilityStore();

  const handleTypeChange = (type) => {
    // Updates the global facility context
    setFacility(facilityId, facilityName, type);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-space-6 bg-bg-secondary p-1 rounded-lg inline-flex border border-border-muted">
      {Object.entries(FACILITY_TYPES).map(([key, config]) => {
        const isActive = facilityType === key;

        return (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            className={twMerge(
              clsx(
                "px-space-4 py-2 rounded-md font-label-bold text-label-bold transition-colors flex items-center gap-2",
                isActive 
                  ? "bg-bg-primary text-text-primary shadow-sm border border-border-muted" 
                  : "bg-transparent text-text-secondary hover:text-text-primary"
              )
            )}
            style={isActive ? { color: config.theme.primary } : undefined}
          >
            <span className="text-[14px]">{config.icon}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FacilitySelector;
