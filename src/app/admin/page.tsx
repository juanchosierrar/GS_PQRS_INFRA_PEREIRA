'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { PQRService } from '@/services/pqr.service';
import { DEPENDENCIAS } from '@/lib/mocks/data';
import { Badge } from '@/components/ui/Badge';
import { format, differenceInDays, parseISO, isPast } from 'date-fns';
import {
    AlertCircle, Clock, CheckCircle2, PlusCircle, Search,
    BarChart3, LayoutDashboard, Building2, MapPin,
    PieChart as PieIcon, TrendingUp, Activity, X
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, LabelList
} from 'recharts';
import { cn } from '@/lib/utils';
import StatCard from '@/components/StatCard';

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams.get('tab') as 'solicitudes' | 'estadisticas' | 'dependencias' | null;

    const [activeTab, setActiveTab] = useState<'solicitudes' | 'estadisticas' | 'dependencias'>(tabParam || 'solicitudes');
    const [filterComuna, setFilterComuna] = useState<string>('');
    const [filterDependencia, setFilterDependencia] = useState<string>('');
    const [filterEstado, setFilterEstado] = useState<string>('');
    const [filterKpi, setFilterKpi] = useState<'all' | 'critical' | 'soon' | 'resolved' | null>(null);

    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: 'solicitudes' | 'estadisticas' | 'dependencias') => {
        setActiveTab(tab);
        router.push(`/admin?tab=${tab}`, { scroll: false });
    };

    const toggleKpiFilter = (type: 'all' | 'critical' | 'soon' | 'resolved') => {
        setFilterKpi(prev => prev === type ? null : type);
    };

    const { data: pqrs, isLoading } = useQuery({
        queryKey: ['pqrs'],
        queryFn: () => PQRService.getAll(),
    });

    const getSemaforo = (fechaVencimiento: string, estado: string) => {
        if (estado === 'RESUELTA' || estado === 'CERRADA') return { variant: 'success' as const, label: 'Completado' };
        const vencimiento = parseISO(fechaVencimiento);
        const diasRestantes = differenceInDays(vencimiento, new Date());
        if (isPast(vencimiento)) return { variant: 'destructive' as const, label: 'Vencido' };
        if (diasRestantes <= 2) return { variant: 'warning' as const, label: 'Por Vencer' };
        return { variant: 'default' as const, label: 'En Plazo' };
    };

    // Listado filtrado base (Comuna, Dependencia, Estado) para los KPIs
    const baseFilteredPQRs = useMemo(() => {
        if (!pqrs) return [];
        return pqrs.filter(pqr => {
            const matchesComuna = !filterComuna || pqr.ubicacion.comuna === filterComuna;
            const matchesDep = !filterDependencia || pqr.dependenciaId === filterDependencia;
            const matchesEstado = !filterEstado || pqr.estado === filterEstado;
            return matchesComuna && matchesDep && matchesEstado;
        });
    }, [pqrs, filterComuna, filterDependencia, filterEstado]);

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

    // PQRs que se muestran en la tabla (Urgentes por defecto, o lo seleccionado por KPI)
    const urgentPQRs = useMemo(() => {
        if (!pqrs) return [];

        // Si hay un KPI específico seleccionado, mostrar lo que filteredPQRs encontró
        if (filterKpi !== null) return filteredPQRs;

        // Si no hay KPI, mostrar la lógica de urgencias original
        return filteredPQRs.filter(p => {
            if (p.estado === 'RESUELTA' || p.estado === 'CERRADA') return false;
            const vencimiento = parseISO(p.fechaVencimiento);
            const diasRestantes = differenceInDays(vencimiento, new Date());
            return isPast(vencimiento) || diasRestantes <= 2;
        });
    }, [filteredPQRs, filterKpi, pqrs]);

    // Obtener opciones únicas para los filtros
    const comunasUnicas = useMemo(() => {
        if (!pqrs) return [];
        const comunas = pqrs
            .map(p => p.ubicacion.comuna)
            .filter((c): c is string => !!c);
        return Array.from(new Set(comunas)).sort();
    }, [pqrs]);

    const estadosUnicos = useMemo(() => {
        if (!pqrs) return [];
        const estados = pqrs.map(p => p.estado);
        return Array.from(new Set(estados)).sort();
    }, [pqrs]);

    const stats = useMemo(() => {
        if (!filteredPQRs || filteredPQRs.length === 0) return null;

        const dataByComuna = filteredPQRs.reduce((acc: any, p) => {
            const comuna = p.ubicacion.comuna || 'Sin Comuna';
            acc[comuna] = (acc[comuna] || 0) + 1;
            return acc;
        }, {});

        const dataByStatus = filteredPQRs.reduce((acc: any, p) => {
            acc[p.estado] = (acc[p.estado] || 0) + 1;
            return acc;
        }, {});

        const dataByDep = filteredPQRs.reduce((acc: any, p) => {
            const depName = DEPENDENCIAS.find(d => d.id === p.dependenciaId)?.nombre || 'General';
            if (!acc[depName]) acc[depName] = { total: 0, resolved: 0 };
            acc[depName].total += 1;
            if (p.estado === 'RESUELTA' || p.estado === 'CERRADA') {
                acc[depName].resolved += 1;
            }
            return acc;
        }, {});

        const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

        return {
            comuna: Object.entries(dataByComuna).map(([name, value]) => ({ name, value })).slice(0, 8),
            status: Object.entries(dataByStatus).map(([name, value]) => ({ name, value })),
            dep: Object.entries(dataByDep)
                .map(([name, data]: [string, any]) => ({ name, value: data.total }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            depEfficiency: Object.entries(dataByDep)
                .map(([name, data]: [string, any]) => ({
                    name,
                    value: Math.round((data.resolved / data.total) * 100)
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            colors: COLORS
        };
    }, [filteredPQRs]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-tight">ANALIZANDO TABLERO DE MANDO...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-4 uppercase italic">
                        <BarChart3 className="h-10 w-10 text-primary not-italic" />
                        Tablero Estadístico
                    </h2>
                    <p className="text-muted-foreground font-semibold text-xs tracking-[0.1em] uppercase opacity-70">Análisis de impacto y eficiencia de la gestión municipal</p>
                </div>
            </div>

            {/* Controles de Filtro Base */}
            <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Filtro por Comuna */}
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
                                <option value="">Todas las comunas</option>
                                {comunasUnicas.map((comuna) => (
                                    <option key={comuna} value={comuna}>{comuna}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Dependencia */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                <Building2 className="h-3 w-3" />
                                Dependencia
                            </label>
                            <select
                                value={filterDependencia}
                                onChange={(e) => setFilterDependencia(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all hover:bg-white"
                            >
                                <option value="">Todas las dependencias</option>
                                {DEPENDENCIAS.map((dep) => (
                                    <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Estado */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                <Activity className="h-3 w-3" />
                                Estado
                            </label>
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all hover:bg-white"
                            >
                                <option value="">Todos los estados</option>
                                {estadosUnicos.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Botón Limpiar Filtros */}
                    {(filterComuna || filterDependencia || filterEstado || filterKpi !== null) && (
                        <button
                            onClick={() => {
                                setFilterComuna('');
                                setFilterDependencia('');
                                setFilterEstado('');
                                setFilterKpi(null);
                            }}
                            className="px-8 py-4 rounded-2xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-700 font-black text-xs uppercase tracking-widest transition-all h-[58px]"
                        >
                            <X className="h-4 w-4 inline mr-2" />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Summary Rows (Drives Charts) */}
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

            {stats && (
                <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 animate-in slide-in-from-bottom-4 duration-500 pt-4">
                    <ChartCard title="Distribución por Comuna" description="Incidencias registradas por sector geográfico">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={stats.comuna}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" fontSize={11} fontWeight="bold" tick={{ fill: '#52525b' }} angle={-15} textAnchor="end" height={60} />
                                <YAxis fontSize={11} fontWeight="bold" tick={{ fill: '#52525b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold' }}
                                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                                />
                                <Bar dataKey="value" fill="url(#barGradient)" radius={[10, 10, 0, 0]}>
                                    <LabelList dataKey="value" position="top" style={{ fill: '#52525b', fontSize: '12px', fontWeight: 'bold' }} offset={10} />
                                </Bar>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Estado Global" description="Porcentaje de solicitudes por fase actual">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={stats.status}
                                    cx="50%" cy="50%"
                                    innerRadius={70} outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={true}
                                >
                                    {stats.status.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={stats.colors[index % stats.colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold', padding: '12px' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Carga por Dependencia" description="Volumen de solicitudes asignadas">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={stats.dep} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" fontSize={10} width={140} fontWeight="bold" tick={{ fill: '#52525b' }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold', padding: '12px' }} />
                                <Bar dataKey="value" fill="url(#depGradient)" radius={[0, 10, 10, 0]} barSize={24}>
                                    <LabelList dataKey="value" position="right" style={{ fill: '#52525b', fontSize: '12px', fontWeight: 'bold' }} offset={10} />
                                </Bar>
                                <defs>
                                    <linearGradient id="depGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Eficiencia de Resolución" description="% de solicitudes cerradas por cada área">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={stats.depEfficiency} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" fontSize={10} width={140} fontWeight="bold" tick={{ fill: '#52525b' }} />
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Eficiencia']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold', padding: '12px' }}
                                />
                                <Bar dataKey="value" fill="url(#effGradient)" radius={[0, 10, 10, 0]} barSize={24}>
                                    <LabelList dataKey="value" position="right" formatter={(v: any) => `${v}%`} style={{ fill: '#059669', fontSize: '12px', fontWeight: 'bold' }} offset={10} />
                                </Bar>
                                <defs>
                                    <linearGradient id="effGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="flex h-[60vh] items-center justify-center animate-pulse text-zinc-400 font-bold uppercase tracking-widest italic">Sincronizando Tablero...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

function ChartCard({ title, description, children, className }: { title: string, description: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-8 ${className}`}>
            <div className="space-y-2 border-l-4 border-l-primary pl-6">
                <h3 className="text-xl font-black text-zinc-900 uppercase italic flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-primary not-italic" />
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{description}</p>
            </div>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
