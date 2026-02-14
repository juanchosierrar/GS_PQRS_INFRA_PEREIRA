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
        primary: "from-blue-500 to-blue-600 shadow-blue-300",
        destructive: "from-rose-500 to-rose-600 shadow-rose-300",
        warning: "from-amber-500 to-amber-600 shadow-amber-300",
        success: "from-emerald-500 to-emerald-600 shadow-emerald-300"
    };

    const activeBorders = {
        primary: "border-blue-500 ring-4 ring-blue-100",
        destructive: "border-rose-500 ring-4 ring-rose-100",
        warning: "border-amber-500 ring-4 ring-amber-100",
        success: "border-emerald-500 ring-4 ring-emerald-100"
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-[2rem] border-2 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer",
                active ? activeBorders[color] : "border-zinc-100"
            )}
        >
            <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                    active ? "text-zinc-900" : "text-zinc-400"
                )}>{title}</h3>
                <div className={cn(
                    "p-3 rounded-2xl bg-gradient-to-br text-white group-hover:scale-110 transition-transform shadow-lg",
                    colors[color]
                )}>
                    {icon}
                </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <div className="text-5xl font-black tracking-tighter text-zinc-900 italic">{value}</div>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Registros</div>
            </div>
            {active && (
                <div className="absolute top-4 right-16">
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-zinc-900 text-white border-none">Filtro Activo</Badge>
                </div>
            )}
            <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-zinc-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
        </div>
    );
}
