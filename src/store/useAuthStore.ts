import { create } from 'zustand';
import { Usuario } from '@/types';
import { USUARIOS } from '@/lib/mocks/data';

interface AuthState {
    user: Usuario | null;
    login: (email: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: USUARIOS[0], // Mock login: Auto-login as Admin for testing
    login: (email: string) => {
        const user = USUARIOS.find(u => u.email === email) || null;
        set({ user });
    },
    logout: () => set({ user: null }),
}));
