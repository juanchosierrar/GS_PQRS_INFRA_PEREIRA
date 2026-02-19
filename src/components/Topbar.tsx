'use client';

import React from 'react';
import { Search, Bell, Moon, Plus, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface TopbarProps {
    onNewPQR: () => void;
    onToggleSidebar: () => void;
}

export default function Topbar({ onNewPQR, onToggleSidebar }: TopbarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const canCreatePQR = user?.rol === 'ADMIN_GENERAL';
    const isInboxView = pathname === '/admin/inbox';

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 px-4 lg:px-10 flex items-center justify-between">
            {/* Mobile Menu & Search Section */}
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
                <button
                    onClick={onToggleSidebar}
                    className="p-2.5 lg:hidden hover:bg-zinc-100 rounded-xl transition-all text-zinc-500 active:scale-95"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar radicado, cédula o solicitante..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-zinc-100/50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white focus:outline-none font-bold text-sm transition-all placeholder:text-zinc-400 placeholder:font-semibold"
                    />
                </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-8">
                <div className="hidden md:flex items-center gap-3 border-r pr-8 border-zinc-100">
                    <button className="p-3 rounded-2xl hover:bg-zinc-100 text-zinc-500 transition-all active:scale-95 hover:text-zinc-900 shadow-sm hover:shadow-md border border-transparent hover:border-zinc-200">
                        <Moon className="h-5 w-5" />
                    </button>
                    <button className="p-3 rounded-2xl hover:bg-zinc-100 text-zinc-500 transition-all relative active:scale-95 hover:text-zinc-900 shadow-sm hover:shadow-md border border-transparent hover:border-zinc-200">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-600 border-2 border-white rounded-full"></span>
                    </button>
                </div>

                {canCreatePQR && isInboxView && (
                    <button
                        onClick={onNewPQR}
                        className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.05] active:scale-95 flex-shrink-0"
                    >
                        <Plus className="h-4 w-4 stroke-[3px]" />
                        Nuevo Radicado
                    </button>
                )}
            </div>
        </header>
    );
}
