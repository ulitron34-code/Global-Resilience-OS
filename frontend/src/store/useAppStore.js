import { create } from 'zustand';
import { CABLES } from '../data/cables';
import { simulateRupture, checkBackend } from '../api/client';

export const useAppStore = create((set, get) => ({
  cables: CABLES,
  selectedCableId: null,
  severity: 'total',
  durationHours: 24,
  result: null,
  isSimulating: false,
  backendStatus: 'unknown',

  selectCable: (cableId) => set({ selectedCableId: cableId, result: null }),
  setSeverity: (severity) => set({ severity }),
  setDurationHours: (durationHours) => set({ durationHours }),

  initBackendCheck: async () => {
    const online = await checkBackend();
    set({ backendStatus: online ? 'online' : 'offline' });
  },

  runSimulation: async () => {
    const { selectedCableId, severity, durationHours } = get();
    if (!selectedCableId) return;
    set({ isSimulating: true });
    const result = await simulateRupture(selectedCableId, severity, durationHours);
    set({
      result,
      isSimulating: false,
      backendStatus: result.source === 'backend' ? 'online' : 'offline',
    });
  },

  reset: () => set({ selectedCableId: null, result: null }),
}));
