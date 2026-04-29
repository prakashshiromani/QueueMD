import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFacilityStore = create(
  persist(
    (set) => ({
      facilityId: null,
      facilityName: null,
      isDemoMode: false, // ✅ New: For UI testing & simulation
      
      setFacility: (id, name, type) => set(() => ({
        facilityId: id,
        facilityName: name,
        facilityType: type || 'clinic',
        isDemoMode: false
      })),

      setFacilityType: (type) => set(() => ({
        facilityType: type
      })),
      
      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      
      clearFacility: () => set(() => ({
        facilityId: null,
        facilityName: null,
        facilityType: 'clinic',
        isDemoMode: false
      }))
    }),
    {
      name: 'queue-md-facility', // localStorage key persists specific facility connection
    }
  )
);
