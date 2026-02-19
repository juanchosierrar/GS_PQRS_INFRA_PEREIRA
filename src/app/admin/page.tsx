'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { PQRService } from '@/services/pqr.service';
import { DEPENDENCIAS } from '@/lib/mocks/data';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import { format, differenceInDays, parseISO, isPast } from 'date-fns';
import {
    AlertCircle, Clock, CheckCircle2, PlusCircle, Search,
    BarChart3, LayoutDashboard, Building2, MapPin,
    PieChart as PieIcon, TrendingUp, Activity, X, ChevronRight, Plus
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, LabelList
} from 'recharts';
import { cn } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const tabParam = searchParams.get('tab') as 'solicitudes' | 'estadisticas' | 'dependencias' | null;

    const [activeTab, setActiveTab] = useState<'solicitudes' | 'estadisticas' | 'dependencias'>(tabParam || 'solicitudes');
    const [filterComuna, setFilterComuna] = useState<string>('');
    const [filterDependencia, setFilterDependencia] = useState<string>(
        user?.rol === 'DIRECTOR_DEPENDENCIA' ? user.dependenciaId || '' : ''
    );
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

    const handleExportCSV = () => {
        if (!filteredPQRs.length) return;
        const headers = ["Radicado", "Fecha Creacion", "Titulo", "Ciudadano", "Estado", "Dependencia", "Comuna"];
        const rows = filteredPQRs.map(pqr => {
            const dep = DEPENDENCIAS.find(d => d.id === pqr.dependenciaId)?.nombre || 'N/A';
            return [
                pqr.radicado,
                format(parseISO(pqr.fechaCreacion), 'dd/MM/yyyy'),
                `"${pqr.titulo.replace(/"/g, '""')}"`,
                `"${pqr.ciudadano.nombre.replace(/"/g, '""')}"`,
                pqr.estado,
                `"${dep}"`,
                `"${pqr.ubicacion.comuna || 'N/A'}"`
            ];
        });
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Estadistico_PQRS_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!filteredPQRs.length) return;
        const doc = new jsPDF();
        const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

        doc.setFillColor(8, 12, 26);
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS DE GESTIÓN PEREIRA', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE EJECUTIVO DE IMPACTO Y EFICIENCIA MUNICIPAL', 105, 30, { align: 'center' });

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, 50, 182, 40, 3, 3, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(14, 50, 182, 40, 3, 3, 'S');

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DE INDICADORES CLAVE (KPI)', 20, 58);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Fecha del Reporte: ${dateStr}`, 20, 65);
        doc.text(`Total Solicitudes Analizadas: ${filteredPQRs.length}`, 20, 71);

        const critical = filteredPQRs.filter(p => isPast(parseISO(p.fechaVencimiento)) && p.estado !== 'RESUELTA').length;
        const resolved = filteredPQRs.filter(p => p.estado === 'RESUELTA' || p.estado === 'CERRADA').length;
        const efficiency = ((resolved / filteredPQRs.length) * 100).toFixed(1);

        doc.setFont('helvetica', 'bold');
        doc.text(`PQRS Críticas: ${critical}`, 120, 65);
        doc.text(`Tasa de Resolución: ${efficiency}%`, 120, 71);

        doc.text('Distribución por Comuna:', 20, 100);
        autoTable(doc, {
            startY: 105,
            head: [['Comuna / Sector', 'No. Radicados']],
            body: (stats?.comuna.map(c => [c.name, c.value]) || []) as any[][],
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 14, right: 110 }
        });

        doc.text('Estado de Solicitudes:', 115, 100);
        autoTable(doc, {
            startY: 105,
            head: [['Estado Actual', 'Cantidad']],
            body: (stats?.status.map(s => [s.name, s.value]) || []) as any[][],
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            margin: { left: 114 }
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Dependencia / Cartera', 'Solicitudes', 'Eficiencia %']],
            body: (stats?.dep.map((d) => [
                d.name,
                d.value,
                `${stats.depEfficiency.find(e => e.name === d.name)?.value || 0}%`
            ]) || []) as any[][],
            headStyles: { fillColor: [8, 12, 26] },
        });

        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Informe de Gestión - Secretaría de Infraestructura - Pereira - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        }

        doc.save(`Reporte_Dashboard_PQRS_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-tight">ANALIZANDO TABLERO DE MANDO...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm">
                <div className="space-y-1.5 border-l-8 border-blue-600 pl-8">
                    <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-4 uppercase italic">
                        {activeTab === 'estadisticas' ? <BarChart3 className="h-10 w-10 text-blue-600 not-italic" /> : <LayoutDashboard className="h-10 w-10 text-blue-600 not-italic" />}
                        {activeTab === 'estadisticas' ? 'Gobierno Inteligente' : 'Resumen Operativo'}
                    </h2>
                    <p className="text-zinc-500 font-black text-[10px] tracking-[0.2em] uppercase opacity-70">
                        {activeTab === 'estadisticas'
                            ? 'ANÁLISIS DE IMPACTO Y EFICIENCIA OPERATIVA MUNICIPAL'
                            : 'CONTROL DE RADICADOS CRÍTICOS Y GESTIÓN INMEDIATA'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    {user?.rol === 'ADMIN_GENERAL' && (
                        <button
                            onClick={() => {
                                // This assumes a way to trigger the global modal via a window event or simple state
                                // Since we don't have a global context for the modal here, we'll suggest a consistent UI
                                // but the Topbar button is the primary one. For Dashboard, we add it for double accessibility.
                                const event = new CustomEvent('open-new-pqr-modal');
                                window.dispatchEvent(event);
                            }}
                            className="flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-1 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Radicado
                        </button>
                    )}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 hover:-translate-y-1 active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-3 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 hover:-translate-y-1 active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        Generar Informe PDF
                    </button>
                </div>
            </div>

            {/* Controles de Filtro Base */}
            <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-full -mr-16 -mt-16 opacity-50" />

                <div className="flex flex-col md:flex-row gap-8 items-end relative z-10">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Filtro por Comuna */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                                <MapPin className="h-3 w-3" />
                                Territorio / Comuna
                            </label>
                            <select
                                value={filterComuna}
                                onChange={(e) => setFilterComuna(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 focus:border-blue-600 focus:outline-none font-black text-xs uppercase tracking-widest bg-zinc-50/50 transition-all hover:bg-white"
                            >
                                <option value="">Toda la Ciudad</option>
                                {comunasUnicas.map((comuna) => (
                                    <option key={comuna} value={comuna}>{comuna}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Dependencia */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                                <Building2 className="h-3 w-3" />
                                Cartera / Dependencia
                            </label>
                            <select
                                value={filterDependencia}
                                disabled={user?.rol === 'DIRECTOR_DEPENDENCIA'}
                                onChange={(e) => setFilterDependencia(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 focus:border-blue-600 focus:outline-none font-black text-xs uppercase tracking-widest bg-zinc-50/50 transition-all hover:bg-white disabled:opacity-70 disabled:grayscale-[0.5]"
                            >
                                <option value="">Todas las Dependencias</option>
                                {DEPENDENCIAS.map((dep) => (
                                    <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Estado */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                                <Activity className="h-3 w-3" />
                                Fase de Gestión
                            </label>
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 focus:border-blue-600 focus:outline-none font-black text-xs uppercase tracking-widest bg-zinc-50/50 transition-all hover:bg-white"
                            >
                                <option value="">Cualquier Estado</option>
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
                                setFilterDependencia(user?.rol === 'DIRECTOR_DEPENDENCIA' ? user.dependenciaId || '' : '');
                                setFilterEstado('');
                                setFilterKpi(null);
                            }}
                            className="px-10 py-4 rounded-2xl border-2 border-zinc-200 bg-white hover:bg-zinc-900 hover:text-white hover:border-zinc-900 text-zinc-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all h-[58px] shadow-sm hover:shadow-xl active:scale-95"
                        >
                            <X className="h-4 w-4 inline mr-2 stroke-[3px]" />
                            RESETEAR
                        </button>
                    )}
                </div>
            </div>

            {/* Tab-specific Content */}
            {activeTab === 'dependencias' ? (
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 animate-in slide-in-from-bottom-4 duration-500">
                    {DEPENDENCIAS.map(dep => {
                        const depPQRs = pqrs?.filter(p => p.dependenciaId === dep.id) || [];
                        const pending = depPQRs.filter(p => !p.asignadoA && p.estado !== 'RESUELTA').length;
                        const inProcess = depPQRs.filter(p => p.asignadoA && p.estado !== 'RESUELTA').length;
                        const resolved = depPQRs.filter(p => p.estado === 'RESUELTA' || p.estado === 'CERRADA').length;

                        return (
                            <button
                                key={dep.id}
                                onClick={() => router.push(`/admin/dependencias/${dep.codigo}`)}
                                className="bg-white border-2 border-zinc-100 rounded-[3rem] p-10 hover:border-primary/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-[5rem] -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="bg-primary/10 p-5 rounded-[1.5rem] group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                            <Building2 className="h-10 w-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter group-hover:text-primary transition-colors">
                                                {dep.nombre}
                                            </h4>
                                            <p className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase italic opacity-70">
                                                ID: {dep.codigo} • Control Operativo
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="default" className="bg-primary/10 text-primary font-black text-[10px] px-3 py-1 rounded-full border-none">
                                        {depPQRs.length} TOTAL
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-6 relative z-10 pt-6 border-t border-zinc-50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Por Asignar</p>
                                        <p className="text-3xl font-black text-amber-500 text-center italic tracking-tighter">{pending}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Gestión</p>
                                        <p className="text-3xl font-black text-blue-600 text-center italic tracking-tighter">{inProcess}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Éxito</p>
                                        <p className="text-3xl font-black text-emerald-500 text-center italic tracking-tighter">{resolved}</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                                        Gestionar Área <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
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

                    {activeTab === 'estadisticas' && stats ? (
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
                                            <LabelList dataKey="value" position="top" style={{ fill: '#3b82f6', fontSize: '14px', fontWeight: '900', fontFamily: 'Inter' }} offset={10} />
                                        </Bar>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
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
                    ) : (
                        <div className="bg-white border-2 border-zinc-100 rounded-[3rem] shadow-xl overflow-hidden relative animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b-2 border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
                                <h3 className="text-xl font-black text-zinc-900 uppercase italic flex items-center gap-3 tracking-tighter">
                                    <AlertCircle className="h-6 w-6 text-rose-600" />
                                    Prioridades de Atención
                                </h3>
                                <Badge variant="destructive" className="font-black text-[10px] px-3 py-1">
                                    {urgentPQRs.length} CRÍTICOS
                                </Badge>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50">
                                        <tr className="border-b-2 border-zinc-100">
                                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Radicado</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Título / Solicitud</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Dependencia</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Estado</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-zinc-50">
                                        {urgentPQRs.length > 0 ? (
                                            urgentPQRs.slice(0, 10).map((pqr) => {
                                                const semaforo = getSemaforo(pqr.fechaVencimiento, pqr.estado);
                                                return (
                                                    <tr key={pqr.id} className="group hover:bg-zinc-50/50 transition-all">
                                                        <td className="p-6">
                                                            <span className="text-lg font-black text-primary underline decoration-primary/20 underline-offset-4 leading-none">
                                                                {pqr.radicado}
                                                            </span>
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase italic mt-1">
                                                                {format(parseISO(pqr.fechaCreacion), 'dd MMM yyyy')}
                                                            </p>
                                                        </td>
                                                        <td className="p-6">
                                                            <p className="font-black text-zinc-800 leading-tight line-clamp-2 max-w-sm">
                                                                {pqr.titulo}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-zinc-400">
                                                                <MapPin className="h-3 w-3" /> {pqr.ubicacion.comuna || 'No especificada'}
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-zinc-300" />
                                                                <span className="text-sm font-bold text-zinc-600">
                                                                    {DEPENDENCIAS.find(d => d.id === pqr.dependenciaId)?.nombre || 'Pendiente'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <Badge variant={semaforo.variant} className="font-black text-[9px] tracking-widest px-3 py-1">
                                                                {semaforo.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <button
                                                                onClick={() => router.push(`/admin/pqr/${pqr.id}`)}
                                                                className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg hover:shadow-primary/20"
                                                            >
                                                                Ver Detalles
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-zinc-300">
                                                        <CheckCircle2 className="h-16 w-16 opacity-20" />
                                                        <p className="text-xl font-black uppercase tracking-widest italic opacity-40">Sin pendientes críticos</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-8 bg-zinc-50/50 border-t-2 border-zinc-50 flex justify-between items-center">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Visualizando <span className="text-zinc-900">{Math.min(urgentPQRs.length, 10)}</span> de las solicitudes más urgentes
                                </p>
                                <button
                                    onClick={() => router.push('/admin/inbox')}
                                    className="flex items-center gap-3 text-xs font-black text-primary uppercase tracking-widest hover:translate-x-2 transition-transform underline underline-offset-8 decoration-2"
                                >
                                    Ir a Bandeja Completa <PlusCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
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
        <div className={`bg-white border-2 border-zinc-100 rounded-[2.5rem] p-12 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col gap-10 relative overflow-hidden group ${className}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />

            <div className="space-y-3 relative z-10 border-l-4 border-blue-600 pl-8">
                <h3 className="text-2xl font-black text-zinc-900 uppercase italic flex items-center gap-3 tracking-tighter">
                    <PieIcon className="h-6 w-6 text-blue-600 not-italic" />
                    {title}
                </h3>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">{description}</p>
            </div>
            <div className="flex-1 min-h-[300px] flex items-center justify-center relative z-10">
                {children}
            </div>
        </div>
    );
}
