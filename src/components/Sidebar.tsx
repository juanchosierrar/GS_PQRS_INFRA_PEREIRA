'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Inbox,
    Clock,
    CheckCircle2,
    BarChart3,
    Users,
    Settings,
    ChevronRight,
    Building2,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { DEPENDENCIAS } from '@/lib/mocks/data';
import { UserSwitcher } from './UserSwitcher';

interface NavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    badge?: number;
    active?: boolean;
}

function NavItem({ href, icon: Icon, label, badge, active }: NavItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300",
                active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-sky-400 hover:bg-white/10 hover:text-white"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 transition-colors", active ? "text-white" : "text-sky-500 group-hover:text-white")} />
                <span className="text-sm font-bold tracking-tight">{label}</span>
            </div>
            {badge !== undefined && (
                <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full",
                    active ? "bg-white/20 text-white" : "bg-rose-500 text-white"
                )}>
                    {badge}
                </span>
            )}
        </Link>
    );
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();

    const isInbox = pathname === '/admin/inbox';

    const userDep = DEPENDENCIAS.find(d => d.id === user?.dependenciaId);
    const depLink = user?.rol === 'DIRECTOR_DEPENDENCIA' && userDep
        ? `/admin/dependencias/${userDep.codigo}`
        : '/admin?tab=dependencias';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "w-72 bg-[#080c1a] text-white h-screen fixed lg:sticky top-0 z-[70] flex flex-col transition-transform duration-500 ease-in-out border-r border-white/5",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="p-8 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-widest uppercase leading-none">
                                INFRAESTRUCTURA
                            </h1>
                            <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mt-1.5 opacity-80 italic">
                                Panel Administrativo Principal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
                    {/* General Group */}
                    <div className="space-y-1">
                        <NavItem
                            href="/admin"
                            icon={LayoutDashboard}
                            label="Panel Principal"
                            active={pathname === '/admin'}
                        />
                    </div>

                    {/* Gestión Group */}
                    <div className="space-y-3">
                        <h3 className="px-4 text-[10px] font-black text-sky-700/80 uppercase tracking-[0.2em]">
                            GESTIÓN PQRS
                        </h3>
                        <div className="space-y-1">
                            <NavItem
                                href="/admin/inbox"
                                icon={Inbox}
                                label="Bandeja de Entrada"
                                badge={12}
                                active={isInbox}
                            />
                            <NavItem
                                href={depLink}
                                icon={Building2}
                                label="Dependencias"
                                active={pathname.includes('/admin/dependencias') || pathname.includes('tab=dependencias')}
                            />
                            <NavItem
                                href="/admin/personal?tab=tecnicos"
                                icon={Users}
                                label="Técnicos"
                                active={pathname.includes('tab=tecnicos')}
                            />
                        </div>
                    </div>

                    {/* Gestión de Personal */}
                    <div className="space-y-3">
                        <h3 className="px-4 text-[10px] font-black text-sky-700/80 uppercase tracking-[0.2em]">
                            Gestión de Personal
                        </h3>
                        <div className="space-y-1">
                            <NavItem
                                href="/admin/personal"
                                icon={Users}
                                label="Personal"
                                active={pathname === '/admin/personal'}
                            />
                        </div>
                    </div>

                    {/* Reportes y Configuración */}
                    <div className="space-y-3">
                        <h3 className="px-4 text-[10px] font-black text-sky-700/80 uppercase tracking-[0.2em]">
                            Administración
                        </h3>
                        <div className="space-y-1">
                            <NavItem
                                href="/admin?tab=estadisticas"
                                icon={BarChart3}
                                label="Reportes de Gestión"
                                active={pathname.includes('tab=estadisticas')}
                            />
                            <NavItem
                                href="/admin/config"
                                icon={Settings}
                                label="Configuración"
                                active={pathname === '/admin/config'}
                            />
                        </div>
                    </div>
                </nav>

                {/* User Switcher for Testing */}
                <div className="p-6 border-t border-white/5 bg-[#081021]">
                    <UserSwitcher />
                </div>
            </aside>
        </>
    );
}
