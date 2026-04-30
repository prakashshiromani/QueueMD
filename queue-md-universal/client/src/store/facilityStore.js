import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFacilityStore = create(
  persist(
    (set) => ({
      facilityId: null,
      facilityName: null,
      isDemoMode: false,
      selectedBranch: null, // ✅ For branch-wise analytics filtering
      
      setFacility: (id, name, type) => set(() => ({
        facilityId: id,
        facilityName: name,
        facilityType: type || 'clinic',
        isDemoMode: false
      })),

      setFacilityType: (type) => set(() => ({
        facilityType: type
      })),

      setSelectedBranch: (branchId) => set(() => ({ selectedBranch: branchId })),
      
      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      
      clearFacility: () => set(() => ({
        facilityId: null,
        facilityName: null,
        facilityType: 'clinic',
        selectedBranch: null,
        isDemoMode: false
      }))
    }),
    {
      name: 'queue-md-facility', // localStorage key persists specific facility connection
    }
  )
);
