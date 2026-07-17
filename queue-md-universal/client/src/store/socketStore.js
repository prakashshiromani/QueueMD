import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  socketStatus: 'connected', // default to connected to prevent initial flashes
  desiredRooms: {}, // e.g. { 'dashboard': { event: 'join_facility_branch', payload: { ... } } }
  setSocketStatus: (status) => set({ socketStatus: status }),
  registerRoom: (key, event, payload) => set((state) => ({
    desiredRooms: {
      ...state.desiredRooms,
      [key]: { event, payload }
    }
  })),
  deregisterRoom: (key) => set((state) => {
    const next = { ...state.desiredRooms };
    delete next[key];
    return { desiredRooms: next };
  }),
}));
