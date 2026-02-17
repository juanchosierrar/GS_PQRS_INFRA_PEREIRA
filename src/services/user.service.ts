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
        await new Promise(resolve => setTimeout(resolve, 300));
        return newUser;
    }

    static async update(userId: string, data: Partial<Usuario>): Promise<Usuario> {
        const users = this.getUsersFromStorage();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
        }

        const updatedUser = { ...users[userIndex], ...data };
        const updatedUsers = [
            ...users.slice(0, userIndex),
            updatedUser,
            ...users.slice(userIndex + 1)
        ];

        this.saveUsersToStorage(updatedUsers);
        await new Promise(resolve => setTimeout(resolve, 300));
        return updatedUser;
    }

    static async delete(userId: string): Promise<void> {
        const users = this.getUsersFromStorage();
        const updatedUsers = users.filter(u => u.id !== userId);

        if (users.length !== updatedUsers.length) {
            this.saveUsersToStorage(updatedUsers);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }
}
