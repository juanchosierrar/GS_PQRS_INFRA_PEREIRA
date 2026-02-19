'use client';

import { Suspense, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { DEPENDENCIAS, USUARIOS, COMUNAS } from '@/lib/mocks/data';
import { Badge } from '@/components/ui/Badge';
import {
    Inbox, Building2, Loader2, UserCircle, AlertCircle,
    CheckCircle2, Search, Filter, MapPin, ArrowRight, User, LayoutDashboard, Clock, Mail, MessageCircle, Download, Plus
} from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import StatCard from '@/components/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterComuna, setFilterComuna] = useState('');
    const [filterDependencia, setFilterDependencia] = useState(user?.rol === 'DIRECTOR_DEPENDENCIA' ? user.dependenciaId : '');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterKpi, setFilterKpi] = useState<'all' | 'critical' | 'soon' | 'resolved' | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
            const matchesDependencia = filterDependencia === '' || pqr.dependenciaId === filterDependencia;
            const matchesTecnico = !activeTecnicoId || pqr.asignadoA === activeTecnicoId;

            return matchesSearch && matchesComuna && matchesEstado && matchesDependencia && matchesTecnico;
        });
    }, [pqrs, searchTerm, filterComuna, filterEstado, filterDependencia, activeTecnicoId]);

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

    // Pagination Logic
    const totalPages = Math.ceil(filteredPQRs.length / itemsPerPage);
    const paginatedPQRs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPQRs.slice(start, start + itemsPerPage);
    }, [filteredPQRs, currentPage]);

    const handleAssign = (pqrId: string) => {
        if (!selectedDependencia || !selectedComuna) return;
        assignMutation.mutate({
            pqrId,
            dependenciaId: selectedDependencia,
            comuna: selectedComuna,
            tecnicoId: selectedTecnico || undefined
        });
    };

    const handleExportCSV = () => {
        if (!filteredPQRs.length) return;

        // Define columns
        const headers = ["Radicado", "Fecha Creacion", "Titulo", "Ciudadano", "Celular", "Estado", "Dependencia", "Comuna", "Tecnico Asignado"];

        // Map data to rows
        const rows = filteredPQRs.map(pqr => {
            const dep = DEPENDENCIAS.find(d => d.id === pqr.dependenciaId)?.nombre || 'N/A';
            const tec = allUsers.find(u => u.id === pqr.asignadoA)?.nombre || 'Sin asignar';

            return [
                pqr.radicado,
                format(parseISO(pqr.fechaCreacion), 'dd/MM/yyyy'),
                `"${pqr.titulo.replace(/"/g, '""')}"`, // Escape quotes
                `"${pqr.ciudadano.nombre.replace(/"/g, '""')}"`,
                pqr.ciudadano.telefono,
                pqr.estado,
                `"${dep}"`,
                `"${pqr.ubicacion.comuna || 'N/A'}"`,
                `"${tec}"`
            ];
        });

        // Join with CSV format
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_PQRS_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!filteredPQRs.length) return;

        const doc = new jsPDF();
        const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

        // Decoración Superior (Franja Azul)
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');

        // Header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('SECRETARÍA DE INFRAESTRUCTURA', 105, 18, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Alcaldía de Pereira - Panel de Control PQRS', 105, 26, { align: 'center' });

        // Info General (Cuadro Blanco Superior)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, 45, 182, 35, 3, 3, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(14, 45, 182, 35, 3, 3, 'S');

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME TÉCNICO DE GESTIÓN', 20, 52);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Fecha de Emisión: ${dateStr}`, 20, 58);
        doc.text(`Usuario: ${user?.nombre || 'Administrador'}`, 20, 63);

        const activeFilters = [];
        if (filterDependencia) activeFilters.push(`Dep: ${DEPENDENCIAS.find(d => d.id === filterDependencia)?.nombre}`);
        if (filterComuna) activeFilters.push(`Comuna: ${filterComuna}`);
        if (filterEstado) activeFilters.push(`Estado: ${filterEstado}`);
        if (searchTerm) activeFilters.push(`Búsqueda: "${searchTerm}"`);

        doc.setFont('helvetica', 'bold');
        doc.text('Filtros Activos:', 20, 71);
        doc.setFont('helvetica', 'normal');
        doc.text(activeFilters.length > 0 ? activeFilters.join(' | ') : 'Todos los registros', 48, 71);

        // Stats Summary Cards (Simuladas)
        const criticalCount = baseFilteredPQRs.filter(p => isPast(parseISO(p.fechaVencimiento)) && p.estado !== 'RESUELTA').length;
        const soonCount = baseFilteredPQRs.filter(p => {
            const dias = differenceInDays(parseISO(p.fechaVencimiento), new Date());
            return dias <= 2 && dias >= 0 && p.estado !== 'RESUELTA';
        }).length;
        const resolvedCount = baseFilteredPQRs.filter(p => p.estado === 'RESUELTA' || p.estado === 'CERRADA').length;

        const startYStats = 85;
        const cardWidth = 42;

        const drawStat = (x: number, title: string, value: string | number, color: [number, number, number]) => {
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(x, startYStats, cardWidth, 20, 2, 2, 'F');
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.line(x, startYStats + 20, x + cardWidth, startYStats + 20);

            doc.setFontSize(7);
            doc.setTextColor(107, 114, 128);
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), x + 21, startYStats + 7, { align: 'center' });

            doc.setFontSize(11);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(String(value), x + 21, startYStats + 15, { align: 'center' });
        };

        drawStat(14, 'Total PQRS', filteredPQRs.length, [37, 99, 235]);
        drawStat(60, 'Críticas', criticalCount, [220, 38, 38]);
        drawStat(106, 'Por Vencer', soonCount, [217, 119, 6]);
        drawStat(152, 'Resueltas', resolvedCount, [5, 150, 105]);

        // Table
        autoTable(doc, {
            startY: 112,
            head: [['Radicado', 'Fecha', 'Título', 'Ciudadano', 'Estado', 'Dependencia']],
            body: filteredPQRs.map(pqr => [
                pqr.radicado,
                format(parseISO(pqr.fechaCreacion), 'dd/MM/yy'),
                pqr.titulo.length > 40 ? pqr.titulo.substring(0, 38) + '...' : pqr.titulo,
                pqr.ciudadano.nombre,
                pqr.estado,
                DEPENDENCIAS.find(d => d.id === pqr.dependenciaId)?.nombre || 'N/A'
            ]),
            styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [37, 99, 235] },
                4: { halign: 'center' }
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 112 },
        });

        // Footer
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(
                `Página ${i} de ${pageCount} - Sistema de Gestión de Infraestructura Pereira - PQRS`,
                105,
                290,
                { align: 'center' }
            );
        }

        doc.save(`Reporte_Gestion_PQRS_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
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
                <div className="flex flex-wrap gap-4">
                    {user?.rol === 'ADMIN_GENERAL' && (
                        <button
                            onClick={() => {
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
                        onClick={handleExportPDF}
                        className="flex items-center gap-3 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 hover:-translate-y-1 active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        Generar Informe PDF
                    </button>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
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
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            Dependencia
                        </label>
                        <select
                            value={filterDependencia}
                            disabled={user?.rol === 'DIRECTOR_DEPENDENCIA'}
                            onChange={(e) => setFilterDependencia(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all hover:bg-white disabled:opacity-70 disabled:grayscale-[0.5]"
                        >
                            <option value="">Todas</option>
                            {DEPENDENCIAS.map(d => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterComuna('');
                            setFilterEstado('');
                            setFilterDependencia(user?.rol === 'DIRECTOR_DEPENDENCIA' ? user.dependenciaId || '' : '');
                            setFilterKpi(null);
                            setCurrentPage(1);
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
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">Radicado</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Solicitud / Ciudadano</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">Comuna</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">Estado</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Dependencia</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">Plazo</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 min-w-[200px]">Técnico</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-zinc-50">
                            {paginatedPQRs.length > 0 ? (
                                paginatedPQRs.map((pqr) => {
                                    const dep = DEPENDENCIAS.find(d => d.id === pqr.dependenciaId);
                                    const tecnico = allUsers.find(u => u.id === pqr.asignadoA);

                                    // Coordinadores can assign to their dependency's technicians
                                    const canAssign = user?.rol === 'ADMIN_GENERAL' ||
                                        (user?.rol === 'DIRECTOR_DEPENDENCIA' && user?.dependenciaId === pqr.dependenciaId);

                                    return (
                                        <tr key={pqr.id} className="group hover:bg-zinc-50/50 transition-all">
                                            <td className="p-4 whitespace-nowrap">
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
                                            <td className="p-4">
                                                <div className="space-y-1 max-w-[250px]">
                                                    <h3 className="font-black text-zinc-800 leading-tight line-clamp-2" title={pqr.titulo}>{pqr.titulo}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <UserCircle className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                                                        {pqr.ciudadano.nombre}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                    {pqr.ubicacion.comuna || <span className="text-zinc-300 italic">No esp...</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <Badge
                                                    variant={!pqr.dependenciaId ? 'destructive' : !pqr.asignadoA ? 'warning' : 'default'}
                                                    className="font-black text-[9px] tracking-widest px-3 py-1"
                                                >
                                                    {!pqr.dependenciaId ? 'NUEVA' : !pqr.asignadoA ? 'ESPERANDO TÉCNICO' : pqr.estado}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                                    <Building2 className="h-4 w-4 text-zinc-300 flex-shrink-0" />
                                                    <span className="line-clamp-1" title={dep?.nombre}>
                                                        {dep?.nombre || <span className="text-zinc-400 italic font-medium">PENDIENTE ASIGNACIÓN</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
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
                                            <td className="p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                                        <User className={cn("h-4 w-4", tecnico ? "text-purple-500" : "text-zinc-300")} />
                                                        {tecnico ? (
                                                            <span className="text-purple-900">{tecnico.nombre}</span>
                                                        ) : (
                                                            <span className="text-zinc-300 italic">Pendiente...</span>
                                                        )}
                                                    </div>
                                                    {tecnico && (
                                                        <div className="flex items-center gap-3 pl-6">
                                                            <div
                                                                title={pqr.notificadoEmail ? "Email Enviado" : "Email Pendiente"}
                                                                className={cn(
                                                                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border transition-all",
                                                                    pqr.notificadoEmail ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-300 border-zinc-100"
                                                                )}
                                                            >
                                                                <Mail className="h-3 w-3" />
                                                                {pqr.notificadoEmail && <span>Email</span>}
                                                            </div>
                                                            <div
                                                                title={pqr.notificadoWhatsapp ? "WhatsApp Enviado" : "WhatsApp Pendiente"}
                                                                className={cn(
                                                                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border transition-all",
                                                                    pqr.notificadoWhatsapp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-300 border-zinc-100"
                                                                )}
                                                            >
                                                                <MessageCircle className="h-3 w-3" />
                                                                {pqr.notificadoWhatsapp && <span>Chat</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canAssign && (
                                                        <button
                                                            onClick={() => {
                                                                setAssigningPqrId(pqr.id);
                                                                setSelectedComuna(pqr.ubicacion.comuna || '');
                                                                setSelectedDependencia(pqr.dependenciaId || '');
                                                            }}
                                                            className="px-3 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
                                                        >
                                                            {pqr.asignadoA ? 'Reasignar' : 'Asignar'}
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
                                    <td colSpan={8} className="p-20 text-center">
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 bg-zinc-50 border-t-2 border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Mostrando <span className="text-zinc-900">{paginatedPQRs.length}</span> de <span className="text-zinc-900">{filteredPQRs.length}</span> registros
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                    document.querySelector('table')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border-2 border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <ArrowRight className="h-4 w-4 rotate-180" />
                            </button>

                            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] md:max-w-none pb-1 md:pb-0">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setCurrentPage(i + 1);
                                            document.querySelector('table')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={cn(
                                            "min-w-[32px] h-8 rounded-xl font-black text-xs transition-all",
                                            currentPage === i + 1
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-zinc-400 hover:bg-zinc-200"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                    document.querySelector('table')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border-2 border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
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
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Área Responsable</label>
                                <select
                                    value={selectedDependencia}
                                    disabled={user?.rol === 'DIRECTOR_DEPENDENCIA'}
                                    onChange={(e) => {
                                        setSelectedDependencia(e.target.value);
                                        setSelectedTecnico('');
                                    }}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-amber-500 focus:outline-none font-bold text-lg appearance-none bg-zinc-50 disabled:opacity-70 disabled:grayscale-[0.5]"
                                >
                                    <option value="">-- SELECCIONAR ÁREA --</option>
                                    {DEPENDENCIAS.map((dep) => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedDependencia && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seleccionar Técnico</label>
                                    <select
                                        value={selectedTecnico}
                                        onChange={(e) => setSelectedTecnico(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-800 font-bold text-lg appearance-none"
                                    >
                                        <option value="">-- SELECCIONAR TÉCNICO --</option>
                                        {allUsers
                                            .filter(u => u.rol === 'TECNICO' && u.dependenciaId === selectedDependencia)
                                            .map(u => (
                                                <option key={u.id} value={u.id}>{u.nombre}</option>
                                            ))
                                        }
                                    </select>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase ml-1 italic tracking-wider">
                                        * El técnico recibirá una notificación para realizar la visita
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
                                        setSelectedTecnico('');
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
