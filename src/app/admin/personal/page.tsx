'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { useAuthStore } from '@/store/useAuthStore';
import { DEPENDENCIAS } from '@/lib/mocks/data';
import {
    Users, TrendingUp, Building2,
    Loader2, LayoutDashboard,
    Clock, MapPin, ChevronRight,
    PieChart, Activity, UserCircle,
    UserPlus, ShieldCheck, Briefcase,
    Edit, Trash2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PersonnelModal } from '@/components/PersonnelModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

function PersonnelManagementContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();

    // Tabs state: 'tecnicos' | 'coordinadores'
    const [activeTab, setActiveTab] = useState<'tecnicos' | 'coordinadores'>(
        (searchParams.get('tab') as 'tecnicos' | 'coordinadores') || 'tecnicos'
    );

    const initialDep = searchParams.get('dep');
    const { user } = useAuthStore();
    const [selectedDepId, setSelectedDepId] = useState<string | null>(
        user?.rol === 'DIRECTOR_DEPENDENCIA' ? user.dependenciaId || null : initialDep
    );
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [deletingUser, setDeletingUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    const isAdmin = user?.rol === 'ADMIN_GENERAL';
    const isDirector = user?.rol === 'DIRECTOR_DEPENDENCIA';
    const canManage = isAdmin || isDirector;

    const loadUsers = async () => {
        const fetchedUsers = await UserService.getAll();
        setUsers(fetchedUsers);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (initialDep && initialDep !== 'null') {
            setSelectedDepId(initialDep);
        }
    }, [initialDep]);

    const { data: allPqrs, isLoading } = useQuery({
        queryKey: ['pqrs'],
        queryFn: () => PQRService.getAll(),
    });

    const tecnicos = useMemo(() => users.filter(u => u.rol === 'TECNICO'), [users]);
    const coordinadores = useMemo(() => users.filter(u => u.rol === 'DIRECTOR_DEPENDENCIA'), [users]);

    const globalStats = useMemo(() => {
        if (!allPqrs) return null;
        const active = allPqrs.filter(p => p.asignadoA && !['RESUELTA', 'CERRADA'].includes(p.estado)).length;
        const resolved = allPqrs.filter(p => ['RESUELTA', 'CERRADA'].includes(p.estado)).length;
        const efficiency = (active + resolved) > 0 ? Math.round((resolved / (active + resolved)) * 100) : 0;
        return { active, resolved, efficiency };
    }, [allPqrs]);

    const activeDependency = useMemo(() =>
        selectedDepId ? DEPENDENCIAS.find(d => d.id === selectedDepId) : null
        , [selectedDepId]);

    const filteredPersonnel = useMemo(() => {
        if (activeTab === 'tecnicos') {
            return selectedDepId
                ? users.filter(t => t.dependenciaId === selectedDepId && t.rol === 'TECNICO')
                : tecnicos;
        } else {
            return coordinadores; // Coordinadores are usually shown at a global directory level or filtered similarly
        }
    }, [activeTab, selectedDepId, users, tecnicos, coordinadores]);

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => UserService.delete(userId),
        onSuccess: () => {
            loadUsers();
            setDeletingUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const handleEdit = (user: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingUser(user);
        setShowModal(true);
    };

    const handleDelete = (user: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingUser(user);
    };

    const confirmDelete = () => {
        if (deletingUser) {
            deleteMutation.mutate(deletingUser.id);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleModalSuccess = () => {
        loadUsers();
        handleModalClose();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium uppercase tracking-widest">Cargando Gestión de Personal...</p>
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
                        <p className="text-muted-foreground font-black text-[10px] tracking-[0.2em] uppercase opacity-70">Control de Talento Humano y Operaciones</p>
                    </div>
                </div>

                {/* Unified Add Button */}
                <div className="flex items-center gap-4">
                    {canManage && (
                        <button
                            onClick={() => setShowModal(true)}
                            className={cn(
                                "text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:scale-95",
                                activeTab === 'tecnicos' ? "bg-zinc-900 hover:bg-zinc-800" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                            )}
                        >
                            <UserPlus className="h-4 w-4" />
                            Nuevo {activeTab === 'tecnicos' ? 'Técnico' : 'Coordinador'}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-3xl w-fit">
                <button
                    onClick={() => setActiveTab('tecnicos')}
                    className={cn(
                        "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'tecnicos'
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-700"
                    )}
                >
                    <Briefcase className="h-4 w-4" />
                    Personal Técnico
                </button>
                <button
                    onClick={() => setActiveTab('coordinadores')}
                    className={cn(
                        "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'coordinadores'
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-700"
                    )}
                >
                    <ShieldCheck className="h-4 w-4" />
                    Coordinadores
                </button>
            </div>

            {/* Conditional Views */}
            {activeTab === 'tecnicos' ? (
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Dependencies */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            Filtrar Áreas
                        </h3>
                        <div className="grid gap-2">
                            {DEPENDENCIAS.map(dep => {
                                if (user?.rol === 'DIRECTOR_DEPENDENCIA' && dep.id !== user.dependenciaId) return null;
                                const isActive = selectedDepId === dep.id;
                                const count = tecnicos.filter(t => t.dependenciaId === dep.id).length;
                                return (
                                    <button
                                        key={dep.id}
                                        onClick={() => setSelectedDepId(isActive ? null : dep.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group text-left",
                                            isActive
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-white border-zinc-100 text-zinc-600 hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 font-black text-[10px] uppercase italic tracking-tighter">
                                            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center font-black", isActive ? "bg-white/20" : "bg-zinc-50 group-hover:bg-primary/10")}>
                                                {dep.codigo}
                                            </div>
                                            {dep.nombre}
                                        </div>
                                        <div className={cn("text-[9px] font-black px-2 py-0.5 rounded-md", isActive ? "bg-white/20" : "bg-zinc-50")}>
                                            {count}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Technicians List Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeDependency && (
                            <div className="bg-zinc-50 border border-zinc-100 rounded-3xl px-6 py-4 flex items-center justify-between mb-4 animate-in slide-in-from-top duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Filtrando por:</p>
                                        <p className="text-sm font-black text-zinc-900 uppercase italic">{activeDependency.nombre}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDepId(null)}
                                    className="text-[10px] font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest border-b border-zinc-200 transition-colors"
                                >
                                    Limpiar Filtro
                                </button>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {filteredPersonnel.length > 0 ? (
                                filteredPersonnel.map(tec => {
                                    const tecPqrs = allPqrs?.filter(p => p.asignadoA === tec.id) || [];
                                    const solved = tecPqrs.filter(p => ['RESUELTA', 'CERRADA'].includes(p.estado)).length;
                                    const activeTaskCount = tecPqrs.length - solved;
                                    const eff = tecPqrs.length > 0 ? Math.round((solved / tecPqrs.length) * 100) : 0;

                                    return (
                                        <div
                                            key={tec.id}
                                            onClick={() => router.push(`/admin/inbox?tecnicoId=${tec.id}`)}
                                            className="bg-white border-2 border-zinc-100 rounded-3xl p-6 hover:shadow-xl transition-all group flex items-center gap-6 cursor-pointer hover:border-primary/30"
                                        >
                                            <div className={cn(
                                                "h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all shadow-inner bg-zinc-50 text-primary group-hover:bg-primary group-hover:text-white"
                                            )}>
                                                {tec.nombre.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-black text-zinc-900 group-hover:text-primary transition-colors uppercase italic tracking-tighter truncate max-w-[150px]">{tec.nombre}</p>
                                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{tec.cargo}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleEdit(tec, e)}
                                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group/edit"
                                                            title="Editar"
                                                        >
                                                            <Edit className="h-4 w-4 text-zinc-400 group-hover/edit:text-blue-600" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(tec, e)}
                                                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors group/delete"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-zinc-400 group-hover/delete:text-rose-600" />
                                                        </button>
                                                        <div className="text-right">
                                                            <p className="text-xl font-black text-zinc-900 leading-none">{eff}%</p>
                                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tight">Eficacia</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 pt-3 border-t border-zinc-50">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                                                        <span className="text-[10px] font-black text-zinc-600 uppercase">{activeTaskCount} Activos</span>
                                                    </div>
                                                    <div className="ml-auto text-primary hover:text-primary/70 transition-colors">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="md:col-span-2 py-20 text-center space-y-4 bg-zinc-50/50 rounded-[3rem] border-2 border-dashed border-zinc-200">
                                    <div className="p-6 bg-white rounded-full w-fit mx-auto shadow-xl">
                                        <Users className="h-10 w-10 text-zinc-300" />
                                    </div>
                                    <p className="text-zinc-400 font-black text-[10px] uppercase tracking-widest">No se encontró personal en esta área</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Coordinators View */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right duration-500">
                    {DEPENDENCIAS.map(dep => {
                        const coord = coordinadores.find(c => c.dependenciaId === dep.id);

                        return (
                            <div
                                key={dep.id}
                                className={cn(
                                    "p-8 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                                    coord
                                        ? "bg-white border-zinc-100 hover:border-amber-500/30 hover:shadow-xl"
                                        : "bg-zinc-50 border-dashed border-zinc-200 opacity-60"
                                )}
                            >
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase mb-2 w-fit">
                                                {dep.codigo}
                                            </div>
                                            <h4 className="font-black text-zinc-900 group-hover:text-amber-600 transition-colors uppercase italic tracking-tighter leading-tight">
                                                {dep.nombre}
                                            </h4>
                                        </div>
                                        {coord && (
                                            <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center font-black text-amber-600 border border-zinc-100">
                                                {coord.nombre.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {coord ? (
                                        <div className="space-y-4 pt-4 border-t border-zinc-50">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-zinc-800 tracking-tight">{coord.nombre}</p>
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{coord.cargo}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(coord, e);
                                                        }}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group/edit"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4 text-zinc-400 group-hover/edit:text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(coord, e);
                                                        }}
                                                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors group/delete"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-zinc-400 group-hover/delete:text-rose-600" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 pt-2 text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <Activity className="h-3 w-3" />
                                                    <span className="text-[9px] font-black uppercase">Gestión Activa</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-10 text-center">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sin Coordinador</p>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('coordinadores');
                                                    setShowModal(true);
                                                }}
                                                className="mt-4 text-[9px] font-black text-amber-600 border-b-2 border-amber-600/20 hover:border-amber-600 uppercase tracking-[0.2em] transition-all"
                                            >
                                                Asignar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {coord && (
                                    <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <ShieldCheck className="h-24 w-24 text-amber-900" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Personnel Modal */}
            {showModal && (
                <PersonnelModal
                    lockedRole={activeTab === 'tecnicos' ? 'TECNICO' : 'DIRECTOR_DEPENDENCIA'}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    currentUser={user}
                    editUser={editingUser}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <DeleteConfirmModal
                    isOpen={!!deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={confirmDelete}
                    userName={deletingUser.nombre}
                    userRole={deletingUser.rol === 'TECNICO' ? 'Técnico' : 'Coordinador'}
                    hasActivePQRs={allPqrs?.some(p => p.asignadoA === deletingUser.id && !['RESUELTA', 'CERRADA'].includes(p.estado))}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    );
}

export default function AdminPersonalPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground uppercase font-black tracking-widest animate-pulse">Cargando Gestión de Personal...</div>}>
            <PersonnelManagementContent />
        </Suspense>
    );
}
