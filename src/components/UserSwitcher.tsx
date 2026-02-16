'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { USUARIOS } from '@/lib/mocks/data';
import { UserCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function UserSwitcher() {
    const { user, login } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleUserChange = (email: string) => {
        login(email);
        setIsOpen(false);
    };

    const getRoleBadgeColor = (rol: string) => {
        switch (rol) {
            case 'ADMIN_GENERAL':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DIRECTOR_DEPENDENCIA':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'TECNICO':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        }
    };

    const getRoleLabel = (rol: string) => {
        switch (rol) {
            case 'ADMIN_GENERAL':
                return 'Admin';
            case 'DIRECTOR_DEPENDENCIA':
                return 'Director';
            case 'TECNICO':
                return 'Técnico';
            default:
                return rol;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 w-full"
            >
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {user?.nombre.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white leading-none">{user?.nombre}</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mt-0.5">
                        {getRoleLabel(user?.rol || '')}
                    </p>
                </div>
                <ChevronDown className={cn(
                    "h-4 w-4 text-zinc-400 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border-2 border-zinc-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 bg-zinc-50 border-b border-zinc-200">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                Cambiar Usuario de Prueba
                            </p>
                        </div>
                        <div className="p-2">
                            {USUARIOS.map((usuario) => (
                                <button
                                    key={usuario.id}
                                    onClick={() => handleUserChange(usuario.email)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                        user?.id === usuario.id
                                            ? "bg-primary/10 border-2 border-primary/30"
                                            : "hover:bg-zinc-50 border-2 border-transparent"
                                    )}
                                >
                                    <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-xs">
                                        {usuario.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 truncate">
                                            {usuario.nombre}
                                        </p>
                                        <p className="text-[10px] font-semibold text-zinc-500 truncate">
                                            {usuario.cargo}
                                        </p>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border",
                                        getRoleBadgeColor(usuario.rol)
                                    )}>
                                        {getRoleLabel(usuario.rol)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
