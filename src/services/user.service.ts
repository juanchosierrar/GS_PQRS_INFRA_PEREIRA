import { USUARIOS } from '@/lib/mocks/data';
import { Usuario } from '@/types';

const STORAGE_KEY = 'infrapqr_users';

export class UserService {
    private static getUsersFromStorage(): Usuario[] {
        if (typeof window === 'undefined') return USUARIOS;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(USUARIOS));
            return USUARIOS;
        }
        return JSON.parse(stored);
    }

    private static saveUsersToStorage(users: Usuario[]) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        }
    }

    static async getAll(): Promise<Usuario[]> {
        // Simulating async
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.getUsersFromStorage();
    }

    static async getByDependency(dependenciaId: string): Promise<Usuario[]> {
        const users = await this.getAll();
        return users.filter(u => u.dependenciaId === dependenciaId);
    }

    static async create(data: Omit<Usuario, 'id'>): Promise<Usuario> {
        const users = this.getUsersFromStorage();
        const newUser: Usuario = {
            ...data,
            id: `usr-${Math.random().toString(36).substr(2, 9)}`,
        };

        const updatedUsers = [...users, newUser];
        this.saveUsersToStorage(updatedUsers);
        return newUser;
    }
}
