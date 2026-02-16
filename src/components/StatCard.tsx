'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface StatCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    color: 'primary' | 'destructive' | 'warning' | 'success';
    active?: boolean;
    onClick?: () => void;
}

export default function StatCard({ title, value, icon, color, active, onClick }: StatCardProps) {
    const colors = {
        primary: "from-blue-600 to-blue-700 shadow-blue-600/20",
        destructive: "from-rose-600 to-rose-700 shadow-rose-600/20",
        warning: "from-amber-500 to-amber-600 shadow-amber-500/20",
        success: "from-emerald-500 to-emerald-600 shadow-emerald-500/20"
    };

    const activeBorders = {
        primary: "border-blue-600 ring-8 ring-blue-600/5",
        destructive: "border-rose-600 ring-8 ring-rose-600/5",
        warning: "border-amber-500 ring-8 ring-amber-500/5",
        success: "border-emerald-500 ring-8 ring-emerald-500/5"
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border-2 bg-white p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer",
                active ? activeBorders[color] : "border-zinc-100"
            )}
        >
            <div className="flex flex-row items-center justify-between space-y-0 pb-6 relative z-10">
                <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-[0.3em] transition-colors",
                    active ? "text-zinc-900" : "text-zinc-400"
                )}>{title}</h3>
                <div className={cn(
                    "p-4 rounded-2xl bg-gradient-to-br text-white group-hover:rotate-12 transition-transform shadow-xl",
                    colors[color]
                )}>
                    {icon}
                </div>
            </div>
            <div className="mt-2 flex items-baseline gap-3 relative z-10">
                <div className="text-6xl font-black tracking-tighter text-zinc-900 italic leading-none">{value}</div>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Registros</div>
            </div>
            {active && (
                <div className="absolute top-6 right-20 z-20">
                    <Badge className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 text-white border-none py-1 px-3 shadow-lg">Filtro Activo</Badge>
                </div>
            )}
            <div className="absolute -bottom-12 -right-12 h-48 w-48 bg-zinc-100/50 rounded-full group-hover:scale-150 transition-transform duration-1000 opacity-30 select-none pointer-events-none"></div>
        </div>
    );
}
