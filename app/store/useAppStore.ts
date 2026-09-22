import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  role: 'HR' | 'OPS' | 'PARTNER' | 'USER';
  email: string;
  tanggalLahir: string;
  grade: string;
  kontrakMulai: string;
  kontrakBerakhir: string;
  sisaCuti: number;
}

interface AppState {
  // Navigation State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Auth/User State
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme/UI Preferences
  compactMode: boolean;
  toggleCompactMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  user: {
    id: '1',
    name: 'Amana User',
    role: 'HR',
    email: 'user@amana.com',
    tanggalLahir: '15 August 1995',
    grade: 'Senior Officer',
    kontrakMulai: '01 Jan 2024',
    kontrakBerakhir: '31 Dec 2026',
    sisaCuti: 12,
  }, // Default mock user, easy to hook up to real backend later
  setUser: (user) => set({ user }),

  compactMode: false,
  toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
}));