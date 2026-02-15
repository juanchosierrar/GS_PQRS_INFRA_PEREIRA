'use client';

import { useState } from 'react';
import { X, FileText, Calendar, Building2, User, MapPin, Loader2, CheckCircle, TrendingUp } from 'lucide-react';
import { DEPENDENCIAS, USUARIOS } from '@/lib/mocks/data';
import { format } from 'date-fns';
import { PQRService } from '@/services/pqr.service';
import { UserService } from '@/services/user.service';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface CreatePQRModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'NIT', 'Pasaporte'];

const SUJETOS_SOLICITANTE = [
    'Ciudadanía (General)',
    'Senador / Representante',
    'Concejal',
    'Diputado',
    'Entidad de Control',
    'Defensoría del Pueblo',
    'Periodista'
];

const COMUNAS = [
    'Cuba',
    'Centro',
    'Villavicencio',
    'Consota',
    'San Joaquín',
    'El Oso',
    'Perla del Otún',
    'Rocío',
    'Boston',
    'Villa Santana',
    'Ferrocarril',
    'Olímpica',
    'Río Otún',
    'San Nicolás',
    'Universidad',
    'Del Café'
];

const TIPOS_TRAMITE = ['Petición', 'Queja', 'Reclamo', 'Sugerencia'];

const CLASES_JURIDICAS = [
    'Interés general o particular',
    'Solicitud de documentos o copias',
    'Consultas (Conceptos jurídicos/técnicos)',
    'Información para ejercicio de control político',
    'Información para ejercicio de control',
    'Inspección, vigilancia o pruebas',
    'Info. sobre Derechos Humanos',
    'Acceso a información pública'
];

const CATEGORIAS = [
    'Comunicación Interna',
    'SAIA Salida Interna',
    'SAIA Salida Externa',
    'Petición General'
];

export default function CreatePQRModal({ isOpen, onClose }: CreatePQRModalProps) {
    const queryClient = useQueryClient();

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => UserService.getAll(),
    });

    const allUsers = users || USUARIOS;
    const [formData, setFormData] = useState({
        radicado: `INF-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
        dependenciaId: '',
        tipoDocumento: 'CC',
        sujeto: 'Ciudadanía (General)',
        numeroDocumento: '',
        nombreCompleto: '',
        telefono: '',
        email: '',
        direccion: '',
        comuna: '',
        // Nuevos campos
        tipoTramite: 'Petición',
        claseJuridica: 'Interés general o particular',
        categoria: '',
        asunto: '',
        evidenciaUrl: '',
        lat: 0,
        lng: 0,
        // Gestión y Seguimiento
        estadoActual: 'NUEVA',
        fechaVencimiento: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 15 días por defecto
        coordinadorResponsable: '',
        tecnicoAsignado: '',
        tieneRespuesta: false,
        observacionesInternas: ''
    });

    const [archivosAdjuntos, setArchivosAdjuntos] = useState<File[]>([]);

    const createPQRMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            // Buscar el tipo de trámite correspondiente
            const tipoTramiteMap: Record<string, string> = {
                'Petición': 'tipo-peticion',
                'Queja': 'tipo-queja',
                'Reclamo': 'tipo-reclamo',
                'Sugerencia': 'tipo-sugerencia'
            };

            return PQRService.create({
                dependenciaId: data.dependenciaId,
                tipotramiteId: tipoTramiteMap[data.tipoTramite] || 'tipo-peticion',
                titulo: data.asunto.substring(0, 100) || 'Sin título',
                descripcion: data.asunto,
                ubicacion: {
                    lat: data.lat || 0,
                    lng: data.lng || 0,
                    direccion: data.direccion,
                    comuna: data.comuna
                },
                ciudadano: {
                    nombre: data.nombreCompleto,
                    telefono: data.telefono,
                    email: data.email,
                    tipoDocumento: data.tipoDocumento,
                    numeroDocumento: data.numeroDocumento,
                    sujeto: data.sujeto
                },
                estado: data.estadoActual as any,
                fechaVencimiento: data.fechaVencimiento,
                claseJuridica: data.claseJuridica,
                categoria: data.categoria,
                evidenciaUrl: data.evidenciaUrl,
                tieneRespuesta: data.tieneRespuesta,
                observacionesInternas: data.observacionesInternas,
                asignadoA: data.tecnicoAsignado || undefined,
                coordinadorResponsable: data.coordinadorResponsable || undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pqrs'] });
            alert('✅ Radicado creado exitosamente');
            onClose();
            // Reset form
            setFormData({
                radicado: `INF-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
                fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
                dependenciaId: '',
                tipoDocumento: 'CC',
                sujeto: 'Ciudadanía (General)',
                numeroDocumento: '',
                nombreCompleto: '',
                telefono: '',
                email: '',
                direccion: '',
                comuna: '',
                tipoTramite: 'Petición',
                claseJuridica: 'Interés general o particular',
                categoria: '',
                asunto: '',
                evidenciaUrl: '',
                lat: 0,
                lng: 0,
                estadoActual: 'NUEVA',
                fechaVencimiento: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                coordinadorResponsable: '',
                tecnicoAsignado: '',
                tieneRespuesta: false,
                observacionesInternas: ''
            });
            setArchivosAdjuntos([]);
        },
        onError: (error) => {
            alert(`❌ Error al crear radicado: ${error.message}`);
        }
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        // Validación básica
        if (!formData.dependenciaId) {
            alert('⚠️ Por favor seleccione una dependencia responsable');
            return;
        }
        if (!formData.nombreCompleto) {
            alert('⚠️ Por favor ingrese el nombre del solicitante');
            return;
        }
        if (!formData.asunto) {
            alert('⚠️ Por favor describa el asunto de la solicitud');
            return;
        }

        createPQRMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 text-white p-6 rounded-t-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-black uppercase italic">Nuevo Radicado</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Sección 1: Información General */}
                    <div className="bg-blue-50/50 rounded-2xl p-6 border-2 border-blue-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <h3 className="text-lg font-black uppercase text-primary">Información General</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Radicado SAIA
                                </label>
                                <input
                                    type="text"
                                    value={formData.radicado}
                                    onChange={(e) => handleChange('radicado', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-bold text-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Fecha Ingreso
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        type="date"
                                        value={formData.fechaIngreso}
                                        onChange={(e) => handleChange('fechaIngreso', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Dependencia Responsable
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <select
                                        value={formData.dependenciaId}
                                        onChange={(e) => handleChange('dependenciaId', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary focus:outline-none font-semibold appearance-none bg-white"
                                    >
                                        <option value="">Seleccione una dependencia...</option>
                                        {DEPENDENCIAS.map((dep) => (
                                            <option key={dep.id} value={dep.id}>
                                                {dep.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Datos del Solicitante */}
                    <div className="bg-emerald-50/50 rounded-2xl p-6 border-2 border-emerald-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <h3 className="text-lg font-black uppercase text-emerald-700">Datos del Solicitante</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Tipo Doc
                                </label>
                                <select
                                    value={formData.tipoDocumento}
                                    onChange={(e) => handleChange('tipoDocumento', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold appearance-none bg-white"
                                >
                                    {TIPOS_DOCUMENTO.map((tipo) => (
                                        <option key={tipo} value={tipo}>
                                            {tipo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Sujeto (Quién Solicita)
                                </label>
                                <select
                                    value={formData.sujeto}
                                    onChange={(e) => handleChange('sujeto', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold appearance-none bg-white"
                                >
                                    {SUJETOS_SOLICITANTE.map((sujeto) => (
                                        <option key={sujeto} value={sujeto}>
                                            {sujeto}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    No. Documento
                                </label>
                                <input
                                    type="text"
                                    value={formData.numeroDocumento}
                                    onChange={(e) => handleChange('numeroDocumento', e.target.value)}
                                    placeholder="Ingrese el número de documento"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Nombre Completo / Razón Social
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={formData.nombreCompleto}
                                        onChange={(e) => handleChange('nombreCompleto', e.target.value)}
                                        placeholder="Ingrese el nombre completo"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => handleChange('telefono', e.target.value)}
                                    placeholder="300 123 4567"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Dirección Física
                                </label>
                                <input
                                    type="text"
                                    value={formData.direccion}
                                    onChange={(e) => handleChange('direccion', e.target.value)}
                                    placeholder="Ej: Cra 7 # 19 - 20"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Comuna
                                </label>
                                <select
                                    value={formData.comuna}
                                    onChange={(e) => handleChange('comuna', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:outline-none font-semibold appearance-none bg-white"
                                >
                                    <option value="">Seleccione...</option>
                                    {COMUNAS.map((comuna) => (
                                        <option key={comuna} value={comuna}>
                                            {comuna}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Documentación Adjunta */}
                    <div className="bg-purple-50/50 rounded-2xl p-6 border-2 border-purple-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <h3 className="text-lg font-black uppercase text-purple-700">Documentación Adjunta</h3>
                        </div>

                        <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 bg-white hover:border-purple-400 transition-all cursor-pointer">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="bg-purple-100 p-4 rounded-full">
                                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-purple-700 mb-1">Subir archivos</p>
                                    <p className="text-xs text-zinc-500">Haz clic o arrastra archivos aquí (PDF, JPG, PNG)</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setArchivosAdjuntos(Array.from(e.target.files));
                                        }
                                    }}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all cursor-pointer"
                                >
                                    Seleccionar Archivos
                                </label>
                            </div>
                            {archivosAdjuntos.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {archivosAdjuntos.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                                            <span className="text-sm font-semibold text-purple-900">{file.name}</span>
                                            <button
                                                onClick={() => setArchivosAdjuntos(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección 4: Detalle de la Solicitud */}
                    <div className="bg-amber-50/50 rounded-2xl p-6 border-2 border-amber-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                4
                            </div>
                            <h3 className="text-lg font-black uppercase text-amber-700">Detalle de la Solicitud</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Tipo de Trámite
                                </label>
                                <select
                                    value={formData.tipoTramite}
                                    onChange={(e) => handleChange('tipoTramite', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-amber-500 focus:outline-none font-semibold appearance-none bg-white"
                                >
                                    {TIPOS_TRAMITE.map((tipo) => (
                                        <option key={tipo} value={tipo}>
                                            {tipo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Clase Jurídica
                                </label>
                                <select
                                    value={formData.claseJuridica}
                                    onChange={(e) => handleChange('claseJuridica', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-amber-500 focus:outline-none font-semibold appearance-none bg-white"
                                >
                                    {CLASES_JURIDICAS.map((clase) => (
                                        <option key={clase} value={clase}>
                                            {clase}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Categoría
                                </label>
                                <select
                                    value={formData.categoria}
                                    onChange={(e) => handleChange('categoria', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-amber-500 focus:outline-none font-semibold appearance-none bg-white"
                                >
                                    <option value="">Seleccione...</option>
                                    {CATEGORIAS.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Asunto / Descripción
                                </label>
                                <textarea
                                    value={formData.asunto}
                                    onChange={(e) => handleChange('asunto', e.target.value)}
                                    placeholder="Describa brevemente la solicitud..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-amber-500 focus:outline-none font-semibold resize-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Evidencia / Enlace Externo
                                </label>
                                <input
                                    type="url"
                                    value={formData.evidenciaUrl}
                                    onChange={(e) => handleChange('evidenciaUrl', e.target.value)}
                                    placeholder="URL o Referencia del documento físico"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-amber-500 focus:outline-none font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 5: Gestión y Seguimiento */}
                    <div className="bg-orange-50/50 rounded-2xl p-6 border-2 border-orange-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                5
                            </div>
                            <h3 className="text-lg font-black uppercase text-orange-700">Gestión y Seguimiento</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Estado Actual
                                </label>
                                <select
                                    value={formData.estadoActual}
                                    onChange={(e) => handleChange('estadoActual', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 focus:outline-none font-bold appearance-none bg-white text-orange-600"
                                >
                                    <option value="NUEVA">NUEVA</option>
                                    <option value="POR_ASIGNAR">POR_ASIGNAR</option>
                                    <option value="EN_PROCESO">EN_PROCESO</option>
                                    <option value="EN_REVISION">EN_REVISION</option>
                                    <option value="RESUELTA">RESUELTA</option>
                                    <option value="DEVUELTA">DEVUELTA</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Fecha Vencimiento
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        type="date"
                                        value={formData.fechaVencimiento}
                                        onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 focus:outline-none font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Coordinador Responsable
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <select
                                        id="coordinador-responsable-select"
                                        value={formData.coordinadorResponsable}
                                        onChange={(e) => handleChange('coordinadorResponsable', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 focus:outline-none font-semibold appearance-none bg-white"
                                    >
                                        <option value="">--- SELECCIONAR COORDINADOR ---</option>
                                        {allUsers
                                            .filter(u => u.rol === 'DIRECTOR_DEPENDENCIA' && (formData.dependenciaId ? u.dependenciaId === formData.dependenciaId : true))
                                            .map((coord) => (
                                                <option key={coord.id} value={coord.id}>
                                                    {coord.nombre}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Técnico Asignado
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.tecnicoAsignado}
                                        onChange={(e) => handleChange('tecnicoAsignado', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 focus:outline-none font-semibold appearance-none bg-white"
                                    >
                                        <option value="">Seleccione...</option>
                                        {allUsers
                                            .filter(u => u.rol === 'TECNICO' && (formData.dependenciaId ? u.dependenciaId === formData.dependenciaId : true))
                                            .map((tecnico) => (
                                                <option key={tecnico.id} value={tecnico.id}>
                                                    {tecnico.nombre}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.tieneRespuesta}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tieneRespuesta: e.target.checked }))}
                                        className="w-5 h-5 rounded border-2 border-zinc-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-black uppercase tracking-widest text-orange-600">
                                        ¿Tiene Respuesta?
                                    </span>
                                </label>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Observaciones Internas
                                </label>
                                <textarea
                                    value={formData.observacionesInternas}
                                    onChange={(e) => handleChange('observacionesInternas', e.target.value)}
                                    placeholder="Notas internas para el equipo..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 focus:outline-none font-semibold resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-zinc-50 border-t-2 border-zinc-200 p-6 rounded-b-3xl flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border-2 border-zinc-300 font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={createPQRMutation.isPending}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createPQRMutation.isPending ? 'Guardando...' : 'Radicar en el Sistema →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
