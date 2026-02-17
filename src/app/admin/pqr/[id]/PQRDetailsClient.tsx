'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { DEPENDENCIAS, TIPOS_TRAMITE, USUARIOS, PQRS_MOCK } from '@/lib/mocks/data';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    ArrowLeft, Edit2, Save, X, Loader2, MapPin, User, Phone, Mail,
    Calendar, Clock, Building2, FileText, AlertCircle, CheckCircle2, IdCard,
    Camera, MapPinned, ClipboardCheck, History, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PQR, PQRStatus, TipoDocumento, SujetoSolicitante } from '@/types';

const ESTADOS: PQRStatus[] = ['NUEVA', 'POR_ASIGNAR', 'EN_PROCESO', 'VISITA_PROGRAMADA', 'RESUELTA', 'DEVUELTA', 'CERRADA', 'VENCIDA'];
const TIPOS_DOCUMENTO: TipoDocumento[] = ['CC', 'CE', 'TI', 'NIT', 'Pasaporte'];
const SUJETOS_SOLICITANTE: SujetoSolicitante[] = ['Ciudadanía (General)', 'Senador / Representante', 'Concejal', 'Diputado', 'Entidad de Control', 'Defensoría del Pueblo', 'Periodista'];

export default function PQRDetailsClient() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editedPQR, setEditedPQR] = useState<PQR | null>(null);
    const [showFichaForm, setShowFichaForm] = useState(false);

    const pqrId = params.id as string;

    const { data: pqr, isLoading: isLoadingPQR } = useQuery({
        queryKey: ['pqr', pqrId],
        queryFn: () => PQRService.getById(pqrId),
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => UserService.getAll(),
    });

    const isLoading = isLoadingPQR || isLoadingUsers;
    const allUsers = users || USUARIOS;

    const updateMutation = useMutation({
        mutationFn: (updatedPQR: PQR) => PQRService.update(pqrId, updatedPQR),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pqr', pqrId] });
            queryClient.invalidateQueries({ queryKey: ['pqrs'] });
            setIsEditing(false);
            setEditedPQR(null);
        },
    });

    const fichaMutation = useMutation({
        mutationFn: (ficha: any) => PQRService.saveFichaTecnica(pqrId, ficha),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pqr', pqrId] });
            queryClient.invalidateQueries({ queryKey: ['pqrs'] });
            setShowFichaForm(false);
        },
    });

    const handleEdit = () => {
        setEditedPQR(pqr!);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditedPQR(null);
        setIsEditing(false);
    };

    const handleSave = () => {
        if (editedPQR) {
            updateMutation.mutate(editedPQR);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        if (!editedPQR) return;

        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setEditedPQR({
                ...editedPQR,
                [parent]: {
                    ...(editedPQR as any)[parent],
                    [child]: value,
                },
            });
        } else {
            setEditedPQR({
                ...editedPQR,
                [field]: value,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">CARGANDO DETALLES...</p>
            </div>
        );
    }

    if (!pqr) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle className="h-16 w-16 text-rose-500" />
                <p className="text-xl font-bold text-zinc-400 uppercase tracking-wider">PQR No Encontrada</p>
                <button
                    onClick={() => router.push('/admin')}
                    className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    const displayPQR = isEditing ? editedPQR! : pqr;
    const dependencia = DEPENDENCIAS.find(d => d.id === displayPQR.dependenciaId);
    const tipoTramite = TIPOS_TRAMITE.find(t => t.id === displayPQR.tipotramiteId);
    const tecnicoAsignado = displayPQR.asignadoA ? allUsers.find(u => u.id === displayPQR.asignadoA) : null;

    // RBAC
    const isAdminGeneral = user?.rol === 'ADMIN_GENERAL';
    const isDirectorDep = user?.rol === 'DIRECTOR_DEPENDENCIA' && user?.dependenciaId === pqr.dependenciaId;
    const isTecnicoAsignado = user?.rol === 'TECNICO' && pqr.asignadoA === user?.id;
    const canEditGeneral = isAdminGeneral;
    const canAssignTech = isAdminGeneral || isDirectorDep;
    const canFillFicha = isTecnicoAsignado || isDirectorDep || isAdminGeneral;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/admin')}
                        className="p-4 rounded-2xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                    >
                        <ArrowLeft className="h-5 w-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-4 uppercase italic">
                                <FileText className="h-10 w-10 text-blue-600 not-italic" />
                                Expediente Digital
                            </h2>
                            <Badge className="bg-blue-600/10 text-blue-600 border-none font-black px-4 py-1 text-[11px] uppercase tracking-widest rounded-full">
                                {pqr.radicado}
                            </Badge>
                        </div>
                        <p className="text-zinc-500 font-bold text-xs tracking-widest uppercase opacity-70">
                            Gestión Integral de Solicitud Ciudadana
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {canFillFicha && pqr.estado !== 'RESUELTA' && pqr.estado !== 'CERRADA' && (
                        <button
                            onClick={() => setShowFichaForm(true)}
                            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-8 py-4 text-xs font-black text-white shadow-2xl transition-all hover:scale-[1.05] active:scale-95 border border-white/10 group uppercase tracking-widest"
                        >
                            <Camera className="mr-3 h-5 w-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                            REGISTRAR VISITA TÉCNICA
                        </button>
                    )}

                    {canEditGeneral && (
                        <div className="flex items-center gap-4">
                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-xs font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:shadow-2xl hover:shadow-blue-600/30 hover:scale-[1.05] active:scale-95 uppercase tracking-widest"
                                >
                                    <Edit2 className="mr-3 h-5 w-5 stroke-[2.5px]" />
                                    EDITAR EXPEDIENTE
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={updateMutation.isPending}
                                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-8 py-4 text-xs font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-[1.05] active:scale-95 uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {updateMutation.isPending ? (
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        ) : (
                                            <Save className="mr-3 h-5 w-5" />
                                        )}
                                        {updateMutation.isPending ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="inline-flex items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white px-8 py-4 text-xs font-black text-zinc-600 transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 uppercase tracking-widest"
                                    >
                                        <X className="mr-3 h-5 w-5" />
                                        CANCELAR
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white border-2 border-zinc-200 rounded-[2rem] p-8 shadow-md">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl font-black text-primary tracking-tighter drop-shadow-sm">
                                    {displayPQR.radicado}
                                </div>
                                <Badge variant="outline" className="uppercase font-black px-3 py-1 text-[10px] tracking-widest bg-zinc-100 text-zinc-600 border-none">
                                    {displayPQR.estado}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                                    Título
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={displayPQR.titulo}
                                        onChange={(e) => handleFieldChange('titulo', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-bold text-lg"
                                    />
                                ) : (
                                    <p className="text-xl font-bold text-zinc-900">{displayPQR.titulo}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                                    Descripción
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={displayPQR.descripcion}
                                        onChange={(e) => handleFieldChange('descripcion', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-medium resize-none"
                                        rows={4}
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-zinc-700 leading-relaxed bg-zinc-50/50 p-4 rounded-3xl border border-zinc-200">
                                        {displayPQR.descripcion}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                                        Estado
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={displayPQR.estado}
                                            onChange={(e) => handleFieldChange('estado', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                        >
                                            {ESTADOS.map((estado) => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Badge variant="outline" className="uppercase font-black border-2 border-zinc-200">
                                            {displayPQR.estado}
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                                        Tipo de Trámite
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={displayPQR.tipotramiteId}
                                            onChange={(e) => handleFieldChange('tipotramiteId', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                        >
                                            {TIPOS_TRAMITE.map((tipo) => (
                                                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm font-bold text-zinc-900">{tipoTramite?.nombre}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Citizen Info Card */}
                    <div className="bg-white border-2 border-zinc-200 rounded-[2rem] p-8 shadow-md">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-3">
                            <div className="h-1.5 w-12 bg-zinc-300 rounded-full" />
                            Información del Ciudadano
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField
                                icon={<User className="h-4 w-4" />}
                                label="Nombre Completo"
                                value={displayPQR.ciudadano.nombre}
                                isEditing={isEditing}
                                onChange={(val) => handleFieldChange('ciudadano.nombre', val)}
                            />
                            <InfoField
                                icon={<Phone className="h-4 w-4" />}
                                label="Teléfono"
                                value={displayPQR.ciudadano.telefono}
                                isEditing={isEditing}
                                onChange={(val) => handleFieldChange('ciudadano.telefono', val)}
                            />
                            <InfoField
                                icon={<Mail className="h-4 w-4" />}
                                label="Email"
                                value={displayPQR.ciudadano.email}
                                isEditing={isEditing}
                                onChange={(val) => handleFieldChange('ciudadano.email', val)}
                                className="md:col-span-2"
                            />

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-1.5">
                                    <IdCard className="h-3.5 w-3.5" />
                                    Tipo Documento
                                </label>
                                {isEditing ? (
                                    <select
                                        value={displayPQR.ciudadano.tipoDocumento || ''}
                                        onChange={(e) => handleFieldChange('ciudadano.tipoDocumento', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {TIPOS_DOCUMENTO.map((tipo) => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-semibold text-zinc-700">{displayPQR.ciudadano.tipoDocumento || 'No especificado'}</p>
                                )}
                            </div>

                            <InfoField
                                icon={<IdCard className="h-4 w-4" />}
                                label="Número Documento"
                                value={displayPQR.ciudadano.numeroDocumento || ''}
                                isEditing={isEditing}
                                onChange={(val) => handleFieldChange('ciudadano.numeroDocumento', val)}
                            />

                            <div className="md:col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                                    Sujeto Solicitante
                                </label>
                                {isEditing ? (
                                    <select
                                        value={displayPQR.ciudadano.sujeto || ''}
                                        onChange={(e) => handleFieldChange('ciudadano.sujeto', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {SUJETOS_SOLICITANTE.map((sujeto) => (
                                            <option key={sujeto} value={sujeto}>{sujeto}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-semibold text-zinc-700">{displayPQR.ciudadano.sujeto || 'No especificado'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="bg-white border-2 border-zinc-200 rounded-[2rem] p-8 shadow-md">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-3">
                            <div className="h-1.5 w-12 bg-zinc-300 rounded-full" />
                            Ubicación
                        </h3>

                        <div className="space-y-4">
                            <InfoField
                                icon={<MapPin className="h-4 w-4" />}
                                label="Dirección"
                                value={displayPQR.ubicacion.direccion}
                                isEditing={isEditing}
                                onChange={(val) => handleFieldChange('ubicacion.direccion', val)}
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <InfoField
                                    label="Comuna"
                                    value={displayPQR.ubicacion.comuna || ''}
                                    isEditing={isEditing}
                                    onChange={(val) => handleFieldChange('ubicacion.comuna', val)}
                                />
                                <div className="col-span-2">
                                    <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 flex items-center justify-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1">
                                            <span className="text-primary italic">LAT:</span> {displayPQR.ubicacion.lat.toFixed(6)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-primary italic">LNG:</span> {displayPQR.ubicacion.lng.toFixed(6)}
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <InfoField
                                                label="Latitud"
                                                value={displayPQR.ubicacion.lat.toString()}
                                                isEditing={isEditing}
                                                onChange={(val) => handleFieldChange('ubicacion.lat', parseFloat(val) || 0)}
                                                type="number"
                                            />
                                            <InfoField
                                                label="Longitud"
                                                value={displayPQR.ubicacion.lng.toString()}
                                                isEditing={isEditing}
                                                onChange={(val) => handleFieldChange('ubicacion.lng', parseFloat(val) || 0)}
                                                type="number"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ficha Técnica / Visita Section */}
                    {(pqr.fichaTecnica || showFichaForm) && (
                        <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ClipboardCheck className="h-40 w-40" />
                            </div>

                            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 mb-8 flex items-center gap-3 italic">
                                <Activity className="h-6 w-6 text-emerald-500 not-italic" />
                                Ficha Técnica de Visita
                            </h3>

                            {showFichaForm ? (
                                <FichaForm
                                    onSubmit={(data) => fichaMutation.mutate(data)}
                                    onCancel={() => setShowFichaForm(false)}
                                    isPending={fichaMutation.isPending}
                                />
                            ) : pqr.fichaTecnica ? (
                                <div className="space-y-10 animate-in fade-in duration-500">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Estado Inicial (Antes)</p>
                                            <div className="aspect-video rounded-3xl bg-zinc-100 flex items-center justify-center border-2 border-dashed border-zinc-200 overflow-hidden">
                                                {pqr.fichaTecnica.fotoAntes ? (
                                                    <img src={pqr.fichaTecnica.fotoAntes} className="w-full h-full object-cover" alt="Antes" />
                                                ) : <Camera className="h-8 w-8 text-zinc-300" />}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Resultado Final (Después)</p>
                                            <div className="aspect-video rounded-3xl bg-zinc-100 flex items-center justify-center border-2 border-dashed border-zinc-200 overflow-hidden">
                                                {pqr.fichaTecnica.fotoDespues ? (
                                                    <img src={pqr.fichaTecnica.fotoDespues} className="w-full h-full object-cover" alt="Después" />
                                                ) : <Camera className="h-8 w-8 text-zinc-300" />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="bg-white p-4 rounded-2xl border border-zinc-200">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <User className="h-3 w-3 text-zinc-500" /> Recibió la Visita
                                                </p>
                                                <p className="text-sm font-black text-zinc-900">{pqr.fichaTecnica.nombreRecibe}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-zinc-200">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-zinc-500" /> Teléfono Contacto
                                                </p>
                                                <p className="text-sm font-black text-zinc-900">{pqr.fichaTecnica.telefonoVisita}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-zinc-200">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-zinc-500" /> Dirección Visita
                                                </p>
                                                <p className="text-sm font-black text-zinc-900">{pqr.fichaTecnica.direccionVisita}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Observaciones de Campo</p>
                                                <p className="text-sm font-bold text-zinc-800 leading-relaxed bg-white p-4 rounded-2xl border border-zinc-200">{pqr.fichaTecnica.observaciones}</p>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50/50 rounded-3xl p-8 border-2 border-emerald-100 border-l-8 border-l-emerald-500">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ClipboardCheck className="h-4 w-4" /> Análisis Técnico de Respuesta
                                            </p>
                                            <p className="text-sm font-bold text-emerald-900 leading-relaxed italic">"{pqr.fichaTecnica.analisisTecnico}"</p>
                                            <div className="mt-6 pt-6 border-t border-emerald-100 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                                    Visita Realizada el: {format(parseISO(pqr.fichaTecnica.fechaVisita), 'dd/MM/yyyy')}
                                                </span>
                                                <Badge className="bg-emerald-500 text-white border-none uppercase text-[8px] font-black px-3">Verificado</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Right Column - Metadata */}
                <div className="space-y-6">
                    {/* Timeline Card */}
                    <div className="bg-white border-2 border-zinc-200 border-l-8 border-l-blue-600 rounded-3xl p-6 shadow-md transition-all hover:shadow-lg">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-700 mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Cronología
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Fecha Creación
                                </div>
                                <p className="text-sm font-bold text-zinc-800 pl-5">
                                    {format(parseISO(displayPQR.fechaCreacion), 'dd/MM/yyyy HH:mm')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Fecha Vencimiento
                                </div>
                                <div className="flex items-center justify-between pl-5 pr-2">
                                    <p className="text-sm font-bold text-zinc-800">
                                        {format(parseISO(displayPQR.fechaVencimiento), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                    {(() => {
                                        const days = differenceInDays(parseISO(displayPQR.fechaVencimiento), new Date());
                                        const isResolved = displayPQR.estado === 'RESUELTA' || displayPQR.estado === 'CERRADA';
                                        if (isResolved) return null;

                                        let styles = "bg-zinc-50 text-zinc-600 border-zinc-100";
                                        if (days <= 0) styles = "bg-rose-100 text-rose-700 border-rose-300 animate-pulse font-black shadow-sm ring-1 ring-rose-300";
                                        else if (days <= 3) styles = "bg-red-100 text-red-700 border-red-300 font-bold";
                                        else if (days <= 5) styles = "bg-amber-100 text-amber-700 border-amber-300 font-bold";
                                        else if (days >= 10) styles = "bg-emerald-100 text-emerald-700 border-emerald-300 font-bold";

                                        return (
                                            <div className={cn("px-2 py-1 rounded text-[10px] font-black border uppercase tracking-tighter", styles)}>
                                                {days <= 0 ? 'VENCIDO' : `${days} DÍAS RESTANTES`}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {displayPQR.fechaCierre && (
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Fecha Cierre
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-700 pl-5">
                                        {format(parseISO(displayPQR.fechaCierre), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assignment Card */}
                    <div className="bg-white border-2 border-zinc-200 border-l-8 border-l-primary rounded-3xl p-6 shadow-md transition-all hover:shadow-lg">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Asignación
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                                    Dependencia
                                </label>
                                {isEditing ? (
                                    <select
                                        value={displayPQR.dependenciaId}
                                        onChange={(e) => handleFieldChange('dependenciaId', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                    >
                                        {DEPENDENCIAS.map((dep) => (
                                            <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-bold text-zinc-800">{dependencia?.nombre}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                                    Técnico Asignado
                                </label>
                                {canAssignTech ? (
                                    <select
                                        value={displayPQR.asignadoA || ''}
                                        onChange={(e) => handleFieldChange('asignadoA', e.target.value || undefined)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold text-sm"
                                        disabled={!isAdminGeneral && !isDirectorDep}
                                    >
                                        <option value="">Sin asignar</option>
                                        {allUsers.filter(u => u.rol === 'TECNICO' && u.dependenciaId === displayPQR.dependenciaId).map((tec) => (
                                            <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-bold text-zinc-800">{tecnicoAsignado?.nombre || 'No asignado'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Fields Card */}
                    {(displayPQR.claseJuridica || displayPQR.categoria || displayPQR.observacionesInternas || isEditing) && (
                        <div className="bg-white border-2 border-zinc-100 border-l-4 border-l-emerald-500 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-6">
                                Información Adicional
                            </h3>

                            <div className="space-y-4">
                                {(displayPQR.claseJuridica || isEditing) && (
                                    <InfoField
                                        label="Clase Jurídica"
                                        value={displayPQR.claseJuridica || ''}
                                        isEditing={isEditing}
                                        onChange={(val) => handleFieldChange('claseJuridica', val)}
                                    />
                                )}
                                {(displayPQR.categoria || isEditing) && (
                                    <InfoField
                                        label="Categoría"
                                        value={displayPQR.categoria || ''}
                                        isEditing={isEditing}
                                        onChange={(val) => handleFieldChange('categoria', val)}
                                    />
                                )}
                                {(displayPQR.observacionesInternas || isEditing) && (
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                                            Observaciones Internas
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={displayPQR.observacionesInternas || ''}
                                                onChange={(e) => handleFieldChange('observacionesInternas', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-medium text-sm resize-none"
                                                rows={3}
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground">{displayPQR.observacionesInternas}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FichaForm({ onSubmit, onCancel, isPending }: { onSubmit: (data: any) => void, onCancel: () => void, isPending: boolean }) {
    const [formData, setFormData] = useState({
        nombreRecibe: '',
        telefonoVisita: '',
        direccionVisita: '',
        observaciones: '',
        analisisTecnico: '',
        fotoAntes: '',
        fotoDespues: '',
        coordenadas: {
            lat: 4.8133,
            lng: -75.6961
        }
    });

    const [isGeocoding, setIsGeocoding] = useState(false);

    const handleGetCoordinates = async () => {
        if (!formData.direccionVisita) return;

        setIsGeocoding(true);
        // Simulating coordinate generation for Pereira
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                coordenadas: {
                    lat: 4.8133 + (Math.random() * 0.005),
                    lng: -75.6961 + (Math.random() * 0.005)
                }
            }));
            setIsGeocoding(false);
        }, 800);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            fechaVisita: new Date().toISOString()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <Camera className="h-3 w-3 text-zinc-500" /> Foto Antes de la Intervención
                    </label>
                    <div className="h-40 rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:bg-zinc-100 transition-colors cursor-pointer overflow-hidden relative">
                        {formData.fotoAntes ? (
                            <img src={formData.fotoAntes} className="w-full h-full object-cover" alt="Preview Antes" />
                        ) : (
                            <>
                                <Camera className="h-8 w-8 text-zinc-300" />
                                <span className="text-[9px] font-black text-zinc-400 uppercase">Input Mock URL</span>
                            </>
                        )}
                        <input
                            type="text"
                            placeholder="URL Mock"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFormData({ ...formData, fotoAntes: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <Camera className="h-3 w-3 text-zinc-500" /> Foto Después de la Intervención
                    </label>
                    <div className="h-40 rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:bg-zinc-100 transition-colors cursor-pointer overflow-hidden relative">
                        {formData.fotoDespues ? (
                            <img src={formData.fotoDespues} className="w-full h-full object-cover" alt="Preview Después" />
                        ) : (
                            <>
                                <Camera className="h-8 w-8 text-zinc-300" />
                                <span className="text-[9px] font-black text-zinc-400 uppercase">Input Mock URL</span>
                            </>
                        )}
                        <input
                            type="text"
                            placeholder="URL Mock"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFormData({ ...formData, fotoDespues: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <User className="h-3 w-3 text-zinc-500" /> Nombre de quien recibe
                    </label>
                    <input
                        required
                        type="text"
                        value={formData.nombreRecibe}
                        onChange={(e) => setFormData({ ...formData, nombreRecibe: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-medium text-sm transition-all"
                        placeholder="Nombre y Apellido"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <Phone className="h-3 w-3 text-zinc-500" /> Teléfono Contacto
                    </label>
                    <input
                        required
                        type="tel"
                        value={formData.telefonoVisita}
                        onChange={(e) => setFormData({ ...formData, telefonoVisita: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-medium text-sm transition-all"
                        placeholder="300 000 0000"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-zinc-500" /> Dirección de la visita
                    </label>
                    <div className="flex gap-2">
                        <input
                            required
                            type="text"
                            value={formData.direccionVisita}
                            onChange={(e) => setFormData({ ...formData, direccionVisita: e.target.value })}
                            className="flex-1 px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-medium text-sm transition-all"
                            placeholder="Calle 123 # 45-67, Pereira"
                        />
                        <button
                            type="button"
                            onClick={handleGetCoordinates}
                            disabled={isGeocoding || !formData.direccionVisita}
                            className="px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 transition-all flex items-center justify-center disabled:opacity-50"
                            title="Integrar Coordenadas"
                        >
                            {isGeocoding ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <MapPinned className="h-5 w-5 text-primary" />
                            )}
                        </button>
                    </div>
                </div>
            </div>


            <div className="grid gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Observaciones de Campo</label>
                    <textarea
                        required
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-primary focus:outline-none font-medium text-sm transition-all"
                        placeholder="Describa lo hallado en sitio..."
                        rows={3}
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Respuesta / Análisis Técnico Final</label>
                    <textarea
                        required
                        value={formData.analisisTecnico}
                        onChange={(e) => setFormData({ ...formData, analisisTecnico: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-100 focus:border-emerald-500 focus:outline-none font-bold text-sm bg-emerald-50/10 transition-all italic"
                        placeholder="Su conclusión técnica sobre la resolución de este radicado..."
                        rows={3}
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl disabled:opacity-50"
                >
                    {isPending ? 'Sincronizando...' : 'Finalizar y Cerrar Radicado'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-8 py-4 rounded-2xl border-2 border-zinc-200 font-black text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}

function InfoField({
    icon,
    label,
    value,
    isEditing,
    onChange,
    className,
    type = 'text',
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    className?: string;
    type?: string;
}) {
    return (
        <div className={cn("space-y-3 transition-all", className)}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                {icon}
                {label}
            </label>
            {isEditing ? (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 focus:border-blue-600 focus:bg-white focus:outline-none font-bold text-sm bg-zinc-50/50 transition-all shadow-inner"
                    step={type === 'number' ? 'any' : undefined}
                />
            ) : (
                <div className="px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm">
                    <p className="text-sm font-black text-zinc-800 tracking-tight uppercase">{value || 'NO SUMINISTRADO'}</p>
                </div>
            )}
        </div>
    );
}
