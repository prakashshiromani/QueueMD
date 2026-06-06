import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  socketStatus: 'connected', // default to connected to prevent initial flashes
  setSocketStatus: (status) => set({ socketStatus: status }),
}));
