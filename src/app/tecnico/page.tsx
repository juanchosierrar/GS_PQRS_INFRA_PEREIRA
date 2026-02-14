'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PQRService } from '@/services/pqr.service';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Camera, CheckCircle, ChevronRight, Loader2, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TecnicoPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [selectedPqrId, setSelectedPqrId] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [coords, setCoords] = useState<string>('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [respuesta, setRespuesta] = useState('');

    const { data: pqrs, isLoading } = useQuery({
        queryKey: ['pqrs-tecnico'],
        queryFn: () => PQRService.getAll(),
    });

    const mutation = useMutation({
        mutationFn: ({ id, response }: { id: string, response: string }) =>
            PQRService.updateStatus(id, 'RESUELTO', response),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pqrs-tecnico'] });
            setSelectedPqrId(null);
            setRespuesta('');
            setPhoto(null);
        }
    });

    const handleGetLocation = () => {
        setIsLocating(true);
        setTimeout(() => {
            setCoords('4.81333, -75.69611');
            setIsLocating(false);
        }, 1500);
    };

    const handleUploadPhoto = () => {
        setIsUploading(true);
        setTimeout(() => {
            setPhoto('https://images.unsplash.com/photo-1584467735815-f778f274e296?q=80&w=400&auto=format&fit=crop');
            setIsUploading(false);
        }, 1500);
    };

    const currentPqr = pqrs?.find(p => p.id === selectedPqrId);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando tareas...</div>;

    if (selectedPqrId && currentPqr) {
        return (
            <div className="max-w-md mx-auto space-y-6 pb-20">
                <button
                    onClick={() => setSelectedPqrId(null)}
                    className="text-primary font-medium flex items-center mb-4"
                >
                    <ChevronRight className="rotate-180 mr-1 h-4 w-4" /> Volver
                </button>

                <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold">{currentPqr.radicado}</h2>
                        <Badge>{currentPqr.estado}</Badge>
                    </div>
                    <p className="font-semibold text-lg">{currentPqr.titulo}</p>
                    <p className="text-muted-foreground text-sm">{currentPqr.descripcion}</p>
                    <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
                        <p><strong>Ubicación:</strong> {currentPqr.ubicacion.direccion}</p>
                        <p><strong>Comuna:</strong> {currentPqr.ubicacion.comuna || 'No especificada'}</p>
                    </div>

                    <button
                        onClick={() => router.push(`/admin/pqr/${currentPqr.id}`)}
                        className="w-full py-3 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <Info className="h-4 w-4" />
                        Ver Información Completa
                    </button>
                </div>

                <div className="bg-card border rounded-lg p-4 shadow-sm space-y-6">
                    <h3 className="font-bold border-b pb-2">Registrar Visita</h3>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Coordenadas GPS</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={coords}
                                placeholder="0.0000, 0.0000"
                                className="flex-1 bg-muted px-3 py-2 rounded border text-sm focus:outline-none"
                            />
                            <button
                                onClick={handleGetLocation}
                                disabled={isLocating}
                                className="bg-primary text-white p-2 rounded flex items-center justify-center min-w-[120px]"
                            >
                                {isLocating ? <Loader2 className="animate-spin h-4 w-4" /> : <MapPin className="h-4 w-4 mr-1" />}
                                {isLocating ? 'Cargando...' : '📍 Ubicación'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Evidencia Fotográfica</label>
                        <div className="flex flex-col items-center gap-4">
                            {photo ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                    <img src={photo} alt="Evidencia" className="object-cover w-full h-full" />
                                </div>
                            ) : (
                                <button
                                    onClick={handleUploadPhoto}
                                    disabled={isUploading}
                                    className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" /> : <Camera className="h-8 w-8 mb-2" />}
                                    <span>{isUploading ? 'Subiendo...' : 'Capturar / Subir Foto'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Respuesta / Observaciones</label>
                        <textarea
                            rows={4}
                            value={respuesta}
                            onChange={(e) => setRespuesta(e.target.value)}
                            className="w-full border rounded p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Describa el trabajo realizado..."
                        />
                    </div>

                    <button
                        disabled={mutation.isPending || !coords || !respuesta}
                        onClick={() => mutation.mutate({ id: currentPqr.id, response: respuesta })}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                        CERRAR PQR
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Mis Tareas</h2>
                <Badge variant='outline'>{pqrs?.filter(p => p.estado !== 'RESUELTO').length || 0} Pendientes</Badge>
            </div>

            <div className="space-y-3">
                {pqrs?.filter(p => p.estado !== 'RESUELTO').map(pqr => (
                    <div
                        key={pqr.id}
                        onClick={() => setSelectedPqrId(pqr.id)}
                        className="bg-card border rounded-xl p-4 shadow-sm flex justify-between items-center cursor-pointer active:bg-muted transition-colors"
                    >
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-primary">{pqr.radicado}</p>
                            <h3 className="font-semibold line-clamp-1">{pqr.titulo}</h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" /> {pqr.ubicacion.direccion}
                            </p>
                        </div>
                        <ChevronRight className="text-muted-foreground" />
                    </div>
                ))}

                {pqrs?.filter(p => p.estado === 'RESUELTO').length! > 0 && (
                    <>
                        <h3 className="text-sm font-bold text-muted-foreground mt-8 mb-2">Completadas</h3>
                        {pqrs?.filter(p => p.estado === 'RESUELTO').map(pqr => (
                            <div key={pqr.id} className="bg-muted/30 border rounded-xl p-4 opacity-70 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground">{pqr.radicado}</p>
                                    <h3 className="font-semibold line-clamp-1 text-muted-foreground">{pqr.titulo}</h3>
                                </div>
                                <CheckCircle className="text-emerald-500 h-5 w-5" />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
