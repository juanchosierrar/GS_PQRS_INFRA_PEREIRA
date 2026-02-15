'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { DEPENDENCIAS, USUARIOS } from '@/lib/mocks/data';
import { Badge } from '@/components/ui/Badge';
import { Building2, UserPlus, Loader2, UserCircle, AlertCircle, CheckCircle, TrendingUp, LayoutDashboard, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';

export default function DependenciaPage() {
    const params = useParams();
    const router = useRouter();
    const codigo = params.codigo as string;
    const [selectedTecnico, setSelectedTecnico] = useState<string>('');
    const [assigningPqrId, setAssigningPqrId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const dependencia = DEPENDENCIAS.find(d => d.codigo === codigo);

    const { data: allPqrs, isLoading: isLoadingPQRs } = useQuery({
        queryKey: ['pqrs'],
        queryFn: () => PQRService.getAll(),
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => UserService.getAll(),
    });

    const isLoading = isLoadingPQRs || isLoadingUsers;
    const allUsers = users || USUARIOS;

    const assignMutation = useMutation({
        mutationFn: ({ pqrId, tecnicoId }: { pqrId: string; tecnicoId: string }) =>
            PQRService.assignTechnician(pqrId, tecnicoId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pqrs'] });
            setAssigningPqrId(null);
            setSelectedTecnico('');
        },
    });

    const handleAssign = (pqrId: string) => {
        if (!selectedTecnico) {
            alert('Por favor selecciona un técnico');
            return;
        }
        assignMutation.mutate({ pqrId, tecnicoId: selectedTecnico });
    };

    if (!dependencia) {
        return <div className="text-center py-20">Dependencia no encontrada</div>;
    }

    const pqrsAsignados = allPqrs?.filter(p =>
        p.dependenciaId === dependencia.id &&
        !p.asignadoA &&
        !['RESUELTA', 'CERRADA', 'DEVUELTA', 'VENCIDA'].includes(p.estado)
    ) || [];

    const pqrsEnProceso = allPqrs?.filter(p =>
        p.dependenciaId === dependencia.id &&
        p.asignadoA &&
        ['EN_PROCESO', 'VISITA_PROGRAMADA'].includes(p.estado)
    ) || [];

    const pqrsResueltos = allPqrs?.filter(p =>
        p.dependenciaId === dependencia.id &&
        (p.estado === 'RESUELTA' || p.estado === 'CERRADA')
    ) || [];
    const tecnicos = allUsers.filter(u => u.dependenciaId === dependencia.id && u.rol === 'TECNICO');

    const getSemaforo = (fechaVencimiento: string, estado: string) => {
        if (estado === 'RESUELTA' || estado === 'CERRADA') return { variant: 'success' as const, label: 'Completado', color: 'text-emerald-500' };
        const vencimiento = parseISO(fechaVencimiento);
        const daysLeft = differenceInDays(vencimiento, new Date());

        if (daysLeft <= 0) return { variant: 'destructive' as const, label: 'Vencido', color: 'text-rose-600' };
        if (daysLeft <= 3) return { variant: 'destructive' as const, label: `${daysLeft} Días`, color: 'text-red-600' };
        if (daysLeft <= 5) return { variant: 'warning' as const, label: `${daysLeft} Días`, color: 'text-amber-500' };
        if (daysLeft >= 10) return { variant: 'success' as const, label: `${daysLeft} Días`, color: 'text-emerald-500' };

        return { variant: 'default' as const, label: `${daysLeft} Días`, color: 'text-blue-500' };
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">CARGANDO DEPENDENCIA...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <button
                        onClick={() => router.push('/admin?tab=dependencias')}
                        className="bg-white border-2 border-zinc-200 p-3 rounded-2xl hover:bg-zinc-50 transition-all shadow-sm group"
                        title="Volver al Tablero"
                    >
                        <LayoutDashboard className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-3 uppercase italic">
                            <Building2 className="h-10 w-10 text-primary not-italic" />
                            {dependencia.nombre}
                        </h2>
                        <p className="text-muted-foreground font-medium">Gestión de radicados asignados a esta dependencia.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-3 rounded-2xl border-2 border-primary/20">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Código:</span>
                    <span className="text-lg font-black text-primary">{dependencia.codigo}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <div className="bg-white border-2 border-zinc-100 border-l-4 border-l-amber-500 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Por Asignar</p>
                    <p className="text-5xl font-black text-zinc-900 italic tracking-tighter">{pqrsAsignados.length}</p>
                </div>
                <div className="bg-white border-2 border-zinc-100 border-l-4 border-l-blue-500 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">En Proceso</p>
                    <p className="text-5xl font-black text-zinc-900 italic tracking-tighter">{pqrsEnProceso.length}</p>
                </div>
                <div className="bg-white border-2 border-zinc-100 border-l-4 border-l-emerald-500 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Resueltos</p>
                    <p className="text-5xl font-black text-zinc-900 italic tracking-tighter">{pqrsResueltos.length}</p>
                </div>
                <div className="bg-white border-2 border-zinc-100 border-l-4 border-l-purple-500 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Técnicos</p>
                    <p className="text-5xl font-black text-zinc-900 italic tracking-tighter">{tecnicos.length}</p>
                </div>
            </div>

            {/* Equipo Técnico Stats Section */}
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-zinc-900 uppercase italic flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-purple-500" />
                    Equipo Técnico y Rendimiento
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tecnicos.map(tec => {
                        const tecPqrs = allPqrs?.filter(p => p.asignadoA === tec.id) || [];
                        const resolved = tecPqrs.filter(p => p.estado === 'RESUELTA' || p.estado === 'CERRADA').length;
                        const total = tecPqrs.length;
                        const efficiency = total > 0 ? Math.round((resolved / total) * 100) : 0;

                        return (
                            <button
                                key={tec.id}
                                onClick={() => router.push(`/admin/inbox?search=${encodeURIComponent(tec.nombre)}`)}
                                className="bg-white border-2 border-zinc-100 rounded-2xl p-5 hover:border-primary/50 hover:shadow-xl transition-all group text-left"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                                        {tec.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors">{tec.nombre}</p>
                                        <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">{tec.cargo}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 rounded-xl bg-zinc-50">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase leading-none mb-1">Total</p>
                                        <p className="text-lg font-black text-zinc-900">{total}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-xl bg-emerald-50">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase leading-none mb-1">Éxito</p>
                                        <p className="text-lg font-black text-emerald-700">{resolved}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-xl bg-purple-50">
                                        <p className="text-[9px] font-black text-purple-600 uppercase leading-none mb-1">Eficiencia</p>
                                        <p className="text-lg font-black text-purple-700">{efficiency}%</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PQRs Por Asignar */}
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-zinc-900 uppercase italic flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                    Radicados Pendientes de Asignación
                </h3>

                {pqrsAsignados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 bg-gradient-to-br from-white to-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                        <CheckCircle className="h-12 w-12 text-emerald-500" />
                        <p className="text-lg font-bold text-zinc-400 uppercase tracking-wider">Sin Radicados Pendientes</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pqrsAsignados.map((pqr) => {
                            const semaforo = getSemaforo(pqr.fechaVencimiento, pqr.estado);
                            return (
                                <div key={pqr.id} className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-xl transition-all">
                                    <div className="flex flex-col lg:flex-row gap-10">
                                        <button
                                            onClick={() => router.push(`/admin/pqr/${pqr.id}`)}
                                            className="flex-1 space-y-6 text-left group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <span className="text-3xl font-black text-primary tracking-tighter group-hover:text-primary/70 transition-colors">
                                                            {pqr.radicado}
                                                        </span>
                                                        <Badge variant={semaforo.variant} className="uppercase font-black text-[10px] tracking-widest px-3 py-1">
                                                            {semaforo.label}
                                                        </Badge>
                                                    </div>
                                                    <h4 className="text-2xl font-black text-zinc-900 italic leading-tight">{pqr.titulo}</h4>
                                                    <p className="text-sm text-zinc-500 font-medium leading-relaxed mt-3 max-w-2xl">{pqr.descripcion}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-8 pt-8 border-t-2 border-zinc-50">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Solicitante</p>
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="h-4 w-4 text-primary opacity-50" />
                                                        <span className="text-sm font-bold text-zinc-700">{pqr.ciudadano.nombre}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Creación</p>
                                                    <span className="text-sm font-bold text-zinc-700">
                                                        {format(parseISO(pqr.fechaCreacion), 'dd MMM yyyy')}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Plazo Restante</p>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-black text-xs tracking-tight",
                                                        (() => {
                                                            const days = differenceInDays(parseISO(pqr.fechaVencimiento), new Date());
                                                            if (days <= 0) return "bg-rose-50 text-rose-600 border-rose-100";
                                                            if (days <= 3) return "bg-red-50 text-red-600 border-red-100";
                                                            if (days <= 5) return "bg-amber-50 text-amber-600 border-amber-100";
                                                            if (days >= 10) return "bg-emerald-50 text-emerald-600 border-emerald-100";
                                                            return "bg-zinc-50 text-zinc-600 border-zinc-100";
                                                        })()
                                                    )}>
                                                        <Clock className="h-3 w-3" />
                                                        {semaforo.label}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>

                                        <div className="lg:w-96 bg-zinc-50/50 rounded-3xl p-8 border-2 border-zinc-100 flex flex-col justify-center">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2 justify-center">
                                                <UserPlus className="h-4 w-4" />
                                                Asignación de Técnico
                                            </h4>

                                            {assigningPqrId === pqr.id ? (
                                                <div className="space-y-4">
                                                    <select
                                                        value={selectedTecnico}
                                                        onChange={(e) => setSelectedTecnico(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                                    >
                                                        <option value="">Seleccionar técnico...</option>
                                                        {tecnicos.map((tec) => (
                                                            <option key={tec.id} value={tec.id}>
                                                                {tec.nombre} - {tec.cargo}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAssign(pqr.id)}
                                                            disabled={!selectedTecnico || assignMutation.isPending}
                                                            className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {assignMutation.isPending ? 'Asignando...' : 'Confirmar'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setAssigningPqrId(null);
                                                                setSelectedTecnico('');
                                                            }}
                                                            className="px-4 py-3 rounded-xl border-2 border-zinc-200 font-bold text-sm hover:bg-zinc-50 transition-all"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAssigningPqrId(pqr.id)}
                                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <UserPlus className="h-5 w-5" />
                                                    Asignar Técnico
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* PQRs En Proceso */}
            {pqrsEnProceso.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-zinc-900 uppercase italic flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-blue-500" />
                        En Proceso ({pqrsEnProceso.length})
                    </h3>
                    <div className="grid gap-4">
                        {pqrsEnProceso.map((pqr) => {
                            const tecnico = allUsers.find(u => u.id === pqr.asignadoA);
                            const semaforo = getSemaforo(pqr.fechaVencimiento, pqr.estado);
                            return (
                                <button
                                    key={pqr.id}
                                    onClick={() => router.push(`/admin/pqr/${pqr.id}`)}
                                    className="bg-white border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-left group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-lg font-black text-primary group-hover:text-primary/70 transition-colors">
                                                    {pqr.radicado}
                                                </span>
                                                <Badge variant={semaforo.variant} className="text-xs">{semaforo.label}</Badge>
                                            </div>
                                            <h4 className="font-bold text-zinc-900">{pqr.titulo}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Asignado a: <span className="font-bold text-primary">{tecnico?.nombre}</span></p>
                                        </div>
                                        <span className={`text-sm font-bold ${semaforo.color}`}>
                                            Vence: {format(parseISO(pqr.fechaVencimiento), 'dd/MM')}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
