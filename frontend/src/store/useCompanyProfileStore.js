import { create } from 'zustand';

const STORAGE_KEY = 'resilience_company_profile';

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export const useCompanyProfileStore = create((set) => ({
  profile: readStoredProfile(),

  saveProfile: (profile) => {
    set({ profile });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // localStorage unavailable (private mode, etc.) — profile stays in-memory only.
    }
  },

  clearProfile: () => {
    set({ profile: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
