'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus, X, Mail, Phone,
    Briefcase, Save, Loader2,
    UserCircle, Activity, Building2, Edit
} from 'lucide-react';
import { UserService } from '@/services/user.service';
import { DEPENDENCIAS } from '@/lib/mocks/data';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface PersonnelModalProps {
    onClose: () => void;
    onSuccess: () => void;
    lockedRole?: 'TECNICO' | 'DIRECTOR_DEPENDENCIA';
    currentUser: any;
    editUser?: any;
}

export function PersonnelModal({ onClose, onSuccess, lockedRole, currentUser, editUser }: PersonnelModalProps) {
    const isAdmin = currentUser?.rol === 'ADMIN_GENERAL';
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = !!editUser;

    const [formData, setFormData] = useState({
        nombre: editUser?.nombre || '',
        email: editUser?.email || '',
        whatsapp: editUser?.whatsapp || '',
        cargo: editUser?.cargo || '',
        dependenciaId: editUser?.dependenciaId || (currentUser?.rol === 'DIRECTOR_DEPENDENCIA' ? currentUser.dependenciaId : ''),
        rol: editUser?.rol || lockedRole || 'TECNICO' as UserRole
    });

    useEffect(() => {
        if (editUser) {
            setFormData({
                nombre: editUser.nombre || '',
                email: editUser.email || '',
                whatsapp: editUser.whatsapp || '',
                cargo: editUser.cargo || '',
                dependenciaId: editUser.dependenciaId || '',
                rol: editUser.rol || 'TECNICO'
            });
        }
    }, [editUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditMode) {
                await UserService.update(editUser.id, formData);
            } else {
                await UserService.create(formData);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const isCoordinator = formData.rol === 'DIRECTOR_DEPENDENCIA';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center",
                            isCoordinator ? "bg-amber-100" : "bg-primary/10"
                        )}>
                            {isEditMode ? (
                                <Edit className={cn("h-6 w-6", isCoordinator ? "text-amber-600" : "text-primary")} />
                            ) : (
                                <UserPlus className={cn("h-6 w-6", isCoordinator ? "text-amber-600" : "text-primary")} />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">
                                {isEditMode ? `Editar ${isCoordinator ? 'Coordinador' : 'Técnico'}` : (lockedRole ? `Nuevo ${isCoordinator ? 'Coordinador' : 'Técnico'}` : 'Nuevo Registro')}
                            </h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                {isCoordinator ? 'Registrar Liderazgo de Dependencia' : 'Registrar Personal Operativo'}
                            </p>
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

                        {!lockedRole && isAdmin && (
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
                                placeholder={isCoordinator ? "Ej: Director de Obras" : "Ej: Maestro de Obra"}
                            />
                        </div>

                        {isAdmin && (
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
                        className={cn(
                            "w-full text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50",
                            isCoordinator ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : "bg-zinc-900 hover:bg-zinc-800"
                        )}
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isEditMode ? 'Actualizar' : 'Guardar'} {isCoordinator ? 'Coordinador' : 'Técnico'}
                    </button>
                    <p className="text-center text-[9px] font-black text-zinc-400 uppercase tracking-widest">Este usuario podrá gestionar PQRS asignados</p>
                </form>
            </div>
        </div>
    );
}
