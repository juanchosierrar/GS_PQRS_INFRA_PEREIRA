'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { useAuthStore } from '@/store/useAuthStore';
import { DEPENDENCIAS, USUARIOS } from '@/lib/mocks/data';
import {
    Users, TrendingUp, Building2,
    Loader2, LayoutDashboard,
    Clock, MapPin, ChevronRight,
    PieChart, Activity, UserCircle,
    UserPlus, X, Mail, Phone,
    Briefcase, Save
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

function AdminTecnicosContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const initialDep = searchParams.get('dep');
    const { user } = useAuthStore();
    const [selectedDepId, setSelectedDepId] = useState<string | null>(initialDep);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    const isAdmin = user?.rol === 'ADMIN_GENERAL';
    const isDirector = user?.rol === 'DIRECTOR_DEPENDENCIA';
    const canAddTecnico = isAdmin || isDirector;

    // Load users from service (persistence)
    const loadUsers = async () => {
        const fetchedUsers = await UserService.getAll();
        setUsers(fetchedUsers);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (initialDep !== undefined && initialDep !== 'null') {
            setSelectedDepId(initialDep);
        }
    }, [initialDep]);

    const { data: allPqrs, isLoading } = useQuery({
        queryKey: ['pqrs'],
        queryFn: () => PQRService.getAll(),
    });

    const tecnicos = useMemo(() => users.filter(u => u.rol === 'TECNICO'), [users]);

    const stats = useMemo(() => {
        if (!allPqrs) return null;

        const active = allPqrs.filter(p => p.asignadoA && !['RESUELTA', 'CERRADA'].includes(p.estado)).length;
        const resolved = allPqrs.filter(p => ['RESUELTA', 'CERRADA'].includes(p.estado)).length;
        const efficiency = (active + resolved) > 0 ? Math.round((resolved / (active + resolved)) * 100) : 0;

        return { active, resolved, efficiency };
    }, [allPqrs]);

    const activeDependency = useMemo(() =>
        selectedDepId ? DEPENDENCIAS.find(d => d.id === selectedDepId) : null
        , [selectedDepId]);

    const depTecnicos = useMemo(() =>
        selectedDepId ? users.filter(t => t.dependenciaId === selectedDepId && (t.rol === 'TECNICO' || t.rol === 'DIRECTOR_DEPENDENCIA')) : []
        , [selectedDepId, users]);

    const activeCoordinador = useMemo(() =>
        depTecnicos.find(t => t.rol === 'DIRECTOR_DEPENDENCIA')
        , [depTecnicos]);

    const depStats = useMemo(() => {
        if (!allPqrs || !selectedDepId) return null;

        const depPqrs = allPqrs.filter(p => p.dependenciaId === selectedDepId);
        const resolved = depPqrs.filter(p => ['RESUELTA', 'CERRADA'].includes(p.estado)).length;
        const total = depPqrs.length;

        // Distribution by Comuna
        const comunaDist: Record<string, number> = {};
        depPqrs.forEach(p => {
            if (p.ubicacion.comuna) {
                comunaDist[p.ubicacion.comuna] = (comunaDist[p.ubicacion.comuna] || 0) + 1;
            }
        });

        return { total, resolved, comunaDist };
    }, [allPqrs, selectedDepId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium uppercase tracking-widest">Analizando Equipo Técnico...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/admin')}
                        className="p-4 rounded-2xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 transition-all shadow-sm group"
                    >
                        <LayoutDashboard className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-4 uppercase italic">
                            <Users className="h-10 w-10 text-primary not-italic" />
                            Gestión de Personal
                        </h2>
                        <p className="text-muted-foreground font-black text-[10px] tracking-[0.2em] uppercase opacity-70">Rendimiento Operativo por Dependencias</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {canAddTecnico && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-zinc-800 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                        >
                            <UserPlus className="h-4 w-4" />
                            Nuevo Técnico
                        </button>
                    )}
                </div>
            </div>

            {/* Global KPIs */}
            <div className="grid gap-6 md:grid-cols-3">
                <KpiCard
                    title="Tecnicos Activos"
                    value={tecnicos.length}
                    icon={<Users className="h-6 w-6 text-blue-500" />}
                    label="Personal en Campo"
                />
                <KpiCard
                    title="Carga Operativa"
                    value={stats?.active || 0}
                    icon={<Clock className="h-6 w-6 text-amber-500" />}
                    label="Tareas Pendientes"
                />
                <KpiCard
                    title="Eficiencia Global"
                    value={`${stats?.efficiency || 0}%`}
                    icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
                    label="Éxito de Cierre"
                />
            </div>

            {/* Selection Grid */}
            <div className="grid lg:grid-cols-4 gap-8">
                {/* Left Sidebar - Dependencies */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        Dependencias
                    </h3>
                    <div className="grid gap-2">
                        {DEPENDENCIAS.map(dep => {
                            const isActive = selectedDepId === dep.id;
                            const count = tecnicos.filter(t => t.dependenciaId === dep.id).length;
                            return (
                                <button
                                    key={dep.id}
                                    onClick={() => setSelectedDepId(isActive ? null : dep.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                                        isActive
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-white border-zinc-100 text-zinc-600 hover:border-primary/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 font-black text-xs uppercase italic tracking-tighter">
                                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black", isActive ? "bg-white/20" : "bg-zinc-50 group-hover:bg-primary/10")}>
                                            {dep.codigo}
                                        </div>
                                        {dep.nombre}
                                    </div>
                                    <div className={cn("text-[10px] font-black px-2 py-1 rounded-md", isActive ? "bg-white/20" : "bg-zinc-50")}>
                                        {count}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    {activeDependency ? (
                        <div className="animate-in slide-in-from-right duration-500 space-y-8">
                            {/* Dependency Banner */}
                            <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Building2 className="h-40 w-40" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black tracking-widest uppercase px-3">
                                                {activeDependency.codigo}
                                            </Badge>
                                            <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                        </div>
                                        <h3 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter">
                                            {activeDependency.nombre}
                                        </h3>
                                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest italic">Análisis de Operaciones del Area</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <StatMini icon={<Activity />} label="Total PQR" value={depStats?.total || 0} />
                                        <StatMini icon={<TrendingUp />} label="Eficacia" value={`${depStats?.total ? Math.round((depStats.resolved / depStats.total) * 100) : 0}%`} />
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Stats: Comuna Distribution */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Concentración por Comunas
                                    </h4>
                                    <div className="space-y-4">
                                        {Object.entries(depStats?.comunaDist || {}).slice(0, 5).sort((a, b) => b[1] - a[1]).map(([comuna, val]) => (
                                            <div key={comuna} className="space-y-1.5">
                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                                    <span className="text-zinc-600">{comuna}</span>
                                                    <span className="text-primary">{val} PQR</span>
                                                </div>
                                                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${(val / (depStats?.total || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-zinc-900 rounded-[2.5rem] p-8 shadow-xl text-white">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-emerald-400" />
                                        Resumen de Equipos
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-4xl font-black italic tracking-tighter text-emerald-400">
                                                {depTecnicos.filter(t => t.rol === 'TECNICO').length}
                                            </p>
                                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Tecnicos en Nómina</p>
                                        </div>
                                        <div className="space-y-1 border-l border-white/10 pl-6">
                                            <p className="text-sm font-black italic tracking-tighter text-blue-400 uppercase">
                                                {activeCoordinador ? activeCoordinador.nombre : 'No asignado'}
                                            </p>
                                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Coordinador Responsable</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Technicians List */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {depTecnicos.map(tec => {
                                    const tecPqrs = allPqrs?.filter(p => p.asignadoA === tec.id) || [];
                                    const solved = tecPqrs.filter(p => ['RESUELTA', 'CERRADA'].includes(p.estado)).length;
                                    const active = tecPqrs.length - solved;
                                    const eff = tecPqrs.length > 0 ? Math.round((solved / tecPqrs.length) * 100) : 0;

                                    return (
                                        <div
                                            key={tec.id}
                                            onClick={() => router.push(`/admin/inbox?tecnicoId=${tec.id}`)}
                                            className="bg-white border-2 border-zinc-100 rounded-3xl p-6 hover:shadow-xl transition-all group flex items-center gap-6 cursor-pointer hover:border-primary/30"
                                        >
                                            <div className={cn(
                                                "h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all shadow-inner",
                                                tec.rol === 'DIRECTOR_DEPENDENCIA'
                                                    ? "bg-amber-100 text-amber-600 border-2 border-amber-200"
                                                    : "bg-zinc-50 text-primary group-hover:bg-primary group-hover:text-white"
                                            )}>
                                                {tec.nombre.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-zinc-900 group-hover:text-primary transition-colors uppercase italic tracking-tighter">{tec.nombre}</p>
                                                            {tec.rol === 'DIRECTOR_DEPENDENCIA' && (
                                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px]">COORDINADOR</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{tec.cargo}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-zinc-900 leading-none">{eff}%</p>
                                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tight">Eficacia</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 pt-3 border-t border-zinc-50">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                                                        <span className="text-[10px] font-black text-zinc-600 uppercase">{active} Activos</span>
                                                    </div>
                                                    <div className="ml-auto text-primary hover:text-primary/70 transition-colors">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-white to-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-100 text-center p-10 animate-in zoom-in duration-500">
                            <div className="p-8 rounded-full bg-white shadow-xl relative">
                                <Activity className="h-20 w-20 text-blue-500/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <UserCircle className="h-10 w-10 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">Selecciona una Dependencia</h3>
                                <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest max-w-xs">Elige un área del menú lateral para ver el rendimiento de su equipo técnico</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Technician Modal */}
            {showModal && (
                <TecnicoModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        queryClient.invalidateQueries({ queryKey: ['users'] });
                        loadUsers();
                    }}
                    currentUser={user}
                />
            )}
        </div>
    );
}

export default function AdminTecnicosPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground uppercase font-black tracking-widest animate-pulse">Cargando Gestión de Personal...</div>}>
            <AdminTecnicosContent />
        </Suspense>
    );
}

function TecnicoModal({ onClose, onSuccess, currentUser }: { onClose: () => void, onSuccess: () => void, currentUser: any }) {
    const isAdmin = currentUser?.rol === 'ADMIN_GENERAL';
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        whatsapp: '',
        cargo: '',
        dependenciaId: currentUser?.rol === 'DIRECTOR_DEPENDENCIA' ? currentUser.dependenciaId : '',
        rol: 'TECNICO' as 'TECNICO' | 'DIRECTOR_DEPENDENCIA'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await UserService.create(formData);
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">Nuevo Registro</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Registrar personal o liderazgo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-xl transition-colors">
                        <X className="h-5 w-5 text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                <UserCircle className="h-3 w-3" /> Nombre Completo
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm transition-all"
                                placeholder="Ej: Roberto Gomez"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Correo Electrónico
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm transition-all"
                                    placeholder="correo@pereira.gov.co"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> WhatsApp
                                </label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm transition-all"
                                    placeholder="300 000 0000"
                                />
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="h-3 w-3" /> Tipo de Usuario
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rol: 'TECNICO', cargo: formData.cargo || 'Técnico de Campo' })}
                                        className={cn(
                                            "py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                            formData.rol === 'TECNICO'
                                                ? "bg-zinc-900 border-zinc-900 text-white shadow-lg"
                                                : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200"
                                        )}
                                    >
                                        Técnico de Campo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rol: 'DIRECTOR_DEPENDENCIA', cargo: formData.cargo || 'Coordinador Responsable' })}
                                        className={cn(
                                            "py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                            formData.rol === 'DIRECTOR_DEPENDENCIA'
                                                ? "bg-amber-500 border-amber-500 text-white shadow-lg"
                                                : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200"
                                        )}
                                    >
                                        Coordinador
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="h-3 w-3" /> Cargo / Especialidad
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.cargo}
                                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm transition-all"
                                placeholder={formData.rol === 'DIRECTOR_DEPENDENCIA' ? "Ej: Director de Obras" : "Ej: Maestro de Obra"}
                            />
                        </div>

                        {currentUser?.rol === 'ADMIN_GENERAL' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="h-3 w-3" /> Dependencia
                                </label>
                                <select
                                    required
                                    value={formData.dependenciaId}
                                    onChange={(e) => setFormData({ ...formData, dependenciaId: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-bold text-sm appearance-none bg-white"
                                >
                                    <option value="">Seleccionar Dependencia</option>
                                    {DEPENDENCIAS.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Guardar {formData.rol === 'DIRECTOR_DEPENDENCIA' ? 'Coordinador' : 'Técnico'}
                    </button>
                    <p className="text-center text-[9px] font-black text-zinc-400 uppercase tracking-widest">Este usuario podrá gestionar PQRs asignados</p>
                </form>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, label }: { title: string, value: string | number, icon: React.ReactNode, label: string }) {
    return (
        <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="p-5 rounded-[1.5rem] bg-zinc-50 shadow-inner group-hover:bg-primary/5 transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black italic tracking-tighter text-zinc-900">{value}</p>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">{label}</span>
                </div>
            </div>
        </div>
    );
}

function StatMini({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
        <div className="bg-zinc-50/80 px-5 py-3 rounded-2xl border border-zinc-100 flex items-center gap-4">
            <div className="text-primary scale-75">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-zinc-900 leading-none mb-1">{value}</p>
                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", className)}>
            {children}
        </span>
    );
}
