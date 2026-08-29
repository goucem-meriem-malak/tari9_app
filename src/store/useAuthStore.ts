import { create } from 'zustand';
import { AppUser, Provider } from '@/types';

interface AuthState {
  firebaseUid: string | null;
  appUser: AppUser | null;
  /** Only relevant when appUser.role === 'worker'. Null = not created yet. */
  providerProfile: Provider | null;
  initializing: boolean;
  setFirebaseUid: (uid: string | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setProviderProfile: (provider: Provider | null) => void;
  setInitializing: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUid: null,
  appUser: null,
  providerProfile: null,
  initializing: true,
  setFirebaseUid: (uid) => set({ firebaseUid: uid }),
  setAppUser: (user) => set({ appUser: user }),
  setProviderProfile: (provider) => set({ providerProfile: provider }),
  setInitializing: (v) => set({ initializing: v }),
}));
