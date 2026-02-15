'use client';

import { Suspense, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { DEPENDENCIAS, USUARIOS, COMUNAS } from '@/lib/mocks/data';
import { Badge } from '@/components/ui/Badge';
import {
    Inbox, Building2, Loader2, UserCircle, AlertCircle,
    CheckCircle2, Search, Filter, MapPin, ArrowRight, User, LayoutDashboard, Clock, PlusCircle
} from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import CreatePQRModal from '@/components/CreatePQRModal';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import StatCard from '@/components/StatCard';
import { useAuthStore } from '@/store/useAuthStore';

const COORDINADORES_MAP: Record<string, string> = {
    'dep-1': 'usr-3', // Téc. Pedro Parques
    'dep-2': 'usr-2', // Ing. Carlos Diseño
    'dep-3': 'usr-4', // Téc. Ana Talleres
    'dep-4': 'usr-5', // Téc. Lucía Privada
};

function InboxContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterComuna, setFilterComuna] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterKpi, setFilterKpi] = useState<'all' | 'critical' | 'soon' | 'resolved' | null>(null);

    // Nuevo filtro por técnico
    const searchTecnicoId = searchParams.get('tecnicoId');
    const isUserTecnico = user?.rol === 'TECNICO';
    const activeTecnicoId = isUserTecnico ? user?.id : searchTecnicoId;

    const [assigningPqrId, setAssigningPqrId] = useState<string | null>(null);
    const [selectedDependencia, setSelectedDependencia] = useState<string>('');
    const [selectedComuna, setSelectedComuna] = useState<string>('');
    const [selectedTecnico, setSelectedTecnico] = useState<string>('');

    const { data: pqrs, isLoading: isLoadingPQRs } = useQuery({
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
        mutationFn: ({ pqrId, dependenciaId, comuna, tecnicoId }: { pqrId: string; dependenciaId: string; comuna: string; tecnicoId?: string }) =>
            PQRService.assignToDependency(pqrId, dependenciaId, comuna, tecnicoId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['pqrs'] });

            const tecnico = allUsers.find(u => u.id === data.asignadoA);
            if (tecnico) {
                alert(`✅ Radicado asignado exitosamente.\n📲 Notificaciones enviadas a ${tecnico.nombre} vía Email y WhatsApp.`);
            } else {
                alert('✅ Radicado asignado exitosamente.');
            }

            setAssigningPqrId(null);
            setSelectedDependencia('');
            setSelectedComuna('');
            setSelectedTecnico('');
        },
    });

    const toggleKpiFilter = (type: 'all' | 'critical' | 'soon' | 'resolved') => {
        setFilterKpi(prev => prev === type ? null : type);
    };

    // Listado filtrado base (Texto, Dependencia, Estado) para los KPIs
    const baseFilteredPQRs = useMemo(() => {
        if (!pqrs) return [];
        return pqrs.filter(pqr => {
            const matchesSearch = searchTerm === '' ||
                pqr.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pqr.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pqr.ciudadano.nombre.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesComuna = filterComuna === '' || (pqr.ubicacion.comuna === filterComuna);
            const matchesEstado = filterEstado === '' || pqr.estado === filterEstado;
            const matchesTecnico = !activeTecnicoId || pqr.asignadoA === activeTecnicoId;

            return matchesSearch && matchesComuna && matchesEstado && matchesTecnico;
        });
    }, [pqrs, searchTerm, filterComuna, filterEstado, activeTecnicoId]);

    const filteredPQRs = useMemo(() => {
        return baseFilteredPQRs.filter(pqr => {
            if (!filterKpi || filterKpi === 'all') return true;
            if (filterKpi === 'critical') {
                return isPast(parseISO(pqr.fechaVencimiento)) && pqr.estado !== 'RESUELTA';
            }
            if (filterKpi === 'soon') {
                const diasRestantes = differenceInDays(parseISO(pqr.fechaVencimiento), new Date());
                return diasRestantes <= 2 && diasRestantes >= 0 && pqr.estado !== 'RESUELTA';
            }
            if (filterKpi === 'resolved') {
                return pqr.estado === 'RESUELTA' || pqr.estado === 'CERRADA';
            }
            return true;
        });
    }, [baseFilteredPQRs, filterKpi]);

    const handleAssign = (pqrId: string) => {
        if (!selectedDependencia || !selectedComuna) return;
        assignMutation.mutate({
            pqrId,
            dependenciaId: selectedDependencia,
            comuna: selectedComuna,
            tecnicoId: selectedTecnico || undefined
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">SINCRONIZANDO GESTION...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-4 uppercase italic">
                        <LayoutDashboard className="h-10 w-10 text-primary not-italic" />
                        Control de Gestión
                    </h2>
                    <p className="text-muted-foreground font-semibold text-xs tracking-[0.1em] uppercase opacity-70">Administración operativa y flujo de trabajo de radicados</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-blue-600 px-8 py-4 text-xs font-black text-white shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-95 uppercase tracking-widest"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    NUEVA SOLICITUD
                </button>
            </div>

            {/* KPI Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Solicitudes Totales"
                    value={baseFilteredPQRs.length}
                    icon={<Search className="h-5 w-5" />}
                    color="primary"
                    active={filterKpi === 'all'}
                    onClick={() => toggleKpiFilter('all')}
                />
                <StatCard
                    title="Críticas / Vencidas"
                    value={baseFilteredPQRs.filter(p => isPast(parseISO(p.fechaVencimiento)) && p.estado !== 'RESUELTA').length}
                    icon={<AlertCircle className="h-5 w-5" />}
                    color="destructive"
                    active={filterKpi === 'critical'}
                    onClick={() => toggleKpiFilter('critical')}
                />
                <StatCard
                    title="Próximas a Vencer"
                    value={baseFilteredPQRs.filter(p => {
                        const diasRestantes = differenceInDays(parseISO(p.fechaVencimiento), new Date());
                        return diasRestantes <= 2 && diasRestantes >= 0 && p.estado !== 'RESUELTA';
                    }).length}
                    icon={<Clock className="h-5 w-5" />}
                    color="warning"
                    active={filterKpi === 'soon'}
                    onClick={() => toggleKpiFilter('soon')}
                />
                <StatCard
                    title="Gestión Exitosa"
                    value={baseFilteredPQRs.filter(p => p.estado === 'RESUELTA' || p.estado === 'CERRADA').length}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    color="success"
                    active={filterKpi === 'resolved'}
                    onClick={() => toggleKpiFilter('resolved')}
                />
            </div>

            {/* Filters Section */}
            <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                            <Search className="h-3 w-3" />
                            Buscar
                        </label>
                        <input
                            type="text"
                            placeholder="Radicado, título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all hover:bg-white"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            Comuna
                        </label>
                        <select
                            value={filterComuna}
                            onChange={(e) => setFilterComuna(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all hover:bg-white"
                        >
                            <option value="">Todas</option>
                            {COMUNAS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                            <Filter className="h-3 w-3" />
                            Estado
                        </label>
                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all hover:bg-white"
                        >
                            <option value="">Todos</option>
                            <option value="NUEVA">NUEVA</option>
                            <option value="POR_ASIGNAR">POR_ASIGNAR</option>
                            <option value="EN_PROCESO">EN_PROCESO</option>
                            <option value="VISITA_PROGRAMADA">VISITA_PROGRAMADA</option>
                            <option value="RESUELTA">RESUELTA</option>
                            <option value="DEVUELTA">DEVUELTA</option>
                            <option value="CERRADA">CERRADA</option>
                            <option value="VENCIDA">VENCIDA</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterComuna('');
                            setFilterEstado('');
                            setFilterKpi(null);
                        }}
                        className="px-8 py-4 rounded-2xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-700 font-black text-xs uppercase tracking-widest transition-all h-[58px]"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[2.5rem] border-2 border-zinc-100 shadow-2xl overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Radicado</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Solicitud / Ciudadano</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Comuna</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Estado</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Dependencia</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Plazo</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Técnico</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-zinc-50">
                            {filteredPQRs.length > 0 ? (
                                filteredPQRs.map((pqr) => {
                                    const dep = DEPENDENCIAS.find(d => d.id === pqr.dependenciaId);
                                    const tecnico = allUsers.find(u => u.id === pqr.asignadoA);

                                    return (
                                        <tr key={pqr.id} className="group hover:bg-zinc-50/50 transition-all">
                                            <td className="p-6">
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={() => router.push(`/admin/pqr/${pqr.id}`)}
                                                        className="text-lg font-black text-primary underline decoration-primary/20 underline-offset-4 leading-none hover:text-primary/70 transition-colors"
                                                    >
                                                        {pqr.radicado}
                                                    </button>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase italic">
                                                        {format(parseISO(pqr.fechaCreacion), 'dd MMM yyyy')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="space-y-1">
                                                    <h3 className="font-black text-zinc-800 leading-tight">{pqr.titulo}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                                                        <UserCircle className="h-3 w-3 text-zinc-400" />
                                                        {pqr.ciudadano.nombre}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                    {pqr.ubicacion.comuna || <span className="text-zinc-300 italic">No esp...</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <Badge
                                                    variant={!pqr.dependenciaId ? 'destructive' : !pqr.asignadoA ? 'warning' : 'default'}
                                                    className="font-black text-[9px] tracking-widest px-3 py-1"
                                                >
                                                    {!pqr.dependenciaId ? 'NUEVA' : !pqr.asignadoA ? 'ESPERANDO TÉCNICO' : pqr.estado}
                                                </Badge>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                                    <Building2 className="h-4 w-4 text-zinc-300" />
                                                    {dep?.nombre || <span className="text-zinc-400 italic font-medium">PENDIENTE ASIGNACIÓN</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                {(() => {
                                                    const vencimiento = parseISO(pqr.fechaVencimiento);
                                                    const daysLeft = differenceInDays(vencimiento, new Date());
                                                    const isResolved = pqr.estado === 'RESUELTA' || pqr.estado === 'CERRADA';

                                                    if (isResolved) return (
                                                        <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] px-2 py-1">FINALIZADO</Badge>
                                                    );

                                                    let styles = "bg-zinc-50 text-zinc-600 border-zinc-100";
                                                    if (daysLeft <= 0) styles = "bg-rose-50 text-rose-600 border-rose-200 animate-pulse";
                                                    else if (daysLeft <= 3) styles = "bg-red-50 text-red-600 border-red-200";
                                                    else if (daysLeft <= 5) styles = "bg-amber-50 text-amber-600 border-amber-200";
                                                    else if (daysLeft >= 10) styles = "bg-emerald-50 text-emerald-600 border-emerald-200";

                                                    return (
                                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-[10px] tracking-tight", styles)}>
                                                            <Clock className="h-3 w-3" />
                                                            {daysLeft <= 0 ? 'VENCIDO' : `${daysLeft} DÍAS`}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                                    <User className="h-4 w-4 text-zinc-300" />
                                                    {tecnico?.nombre || <span className="text-zinc-300 italic">Pendiente...</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!pqr.dependenciaId && (
                                                        <button
                                                            onClick={() => {
                                                                setAssigningPqrId(pqr.id);
                                                                setSelectedComuna(pqr.ubicacion.comuna || '');
                                                            }}
                                                            className="px-3 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                                        >
                                                            Asignar Área
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/admin/pqr/${pqr.id}`)}
                                                        className="px-4 py-2 border-2 border-zinc-100 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-50 transition-all"
                                                    >
                                                        Detalles
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-zinc-300">
                                            <AlertCircle className="h-16 w-16 opacity-20" />
                                            <p className="text-xl font-black uppercase tracking-widest italic opacity-40">No se encontraron registros</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Asignación Rápida */}
            {assigningPqrId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-amber-500/20">
                        <div className="flex items-center gap-4 mb-6 text-amber-600">
                            <div className="bg-amber-100 p-3 rounded-2xl">
                                <Building2 className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic leading-none">Asignar Área</h3>
                                <p className="text-xs font-bold text-amber-700/60 mt-1 uppercase tracking-wider">Paso necesario para el flujo</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seleccionar Dependencia</label>
                                <select
                                    value={selectedDependencia}
                                    onChange={(e) => {
                                        const depId = e.target.value;
                                        setSelectedDependencia(depId);
                                        setSelectedTecnico(COORDINADORES_MAP[depId] || '');
                                    }}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-amber-500 focus:outline-none font-bold text-lg appearance-none bg-zinc-50"
                                >
                                    <option value="">-- SELECCIONAR ÁREA --</option>
                                    {DEPENDENCIAS.map((dep) => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedTecnico && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Coordinador Responsable (Auto-asignado)</label>
                                    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-800 font-bold">
                                        <User className="h-5 w-5 text-emerald-600" />
                                        {allUsers.find(u => u.id === selectedTecnico)?.nombre}
                                    </div>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase ml-1 italic tracking-wider">
                                        * El radicado pasará a estado EN_PROCESO automáticamente
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seleccionar Comuna</label>
                                <select
                                    value={selectedComuna}
                                    onChange={(e) => setSelectedComuna(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-amber-500 focus:outline-none font-bold text-lg appearance-none bg-zinc-50"
                                >
                                    <option value="">-- SELECCIONAR COMUNA --</option>
                                    {COMUNAS.map((comuna) => (
                                        <option key={comuna} value={comuna}>{comuna}</option>
                                    ))}
                                </select>
                                {!selectedComuna && <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">* La comuna es obligatoria para continuar</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleAssign(assigningPqrId)}
                                    disabled={!selectedDependencia || !selectedComuna || assignMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {assignMutation.isPending ? 'Procesando...' : 'Confirmar'}
                                </button>
                                <button
                                    onClick={() => {
                                        setAssigningPqrId(null);
                                        setSelectedDependencia('');
                                        setSelectedComuna('');
                                    }}
                                    className="px-6 py-4 rounded-2xl border-2 border-zinc-100 font-black uppercase text-xs text-zinc-500 hover:bg-zinc-50 transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CreatePQRModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

export default function InboxPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground uppercase font-black tracking-widest animate-pulse">Cargando Inbox...</div>}>
            <InboxContent />
        </Suspense>
    );
}
