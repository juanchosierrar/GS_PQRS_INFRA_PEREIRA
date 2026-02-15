import { PQRS_MOCK, TIPOS_TRAMITE, DEPENDENCIAS, USUARIOS } from '@/lib/mocks/data';
import { UserService } from './user.service';
import { PQR as PQRType, PQRStatus } from '@/types';
import { addDays, format } from 'date-fns';
import { NotificationService } from './notification.service';

const LATENCY = 500;

export class PQRService {
    private static getPQRsFromStorage(): PQRType[] {
        if (typeof window === 'undefined') return PQRS_MOCK;
        const stored = localStorage.getItem('infrapqr_data');
        if (!stored) {
            localStorage.setItem('infrapqr_data', JSON.stringify(PQRS_MOCK));
            return PQRS_MOCK;
        }
        return JSON.parse(stored);
    }

    private static savePQRsToStorage(pqrs: PQRType[]) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('infrapqr_data', JSON.stringify(pqrs));
        }
    }

    static async getAll(): Promise<PQRType[]> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        return this.getPQRsFromStorage();
    }

    static async getById(id: string): Promise<PQRType | undefined> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        return this.getPQRsFromStorage().find(p => p.id === id);
    }

    static async create(data: {
        dependenciaId: string;
        tipotramiteId: string;
        titulo: string;
        descripcion: string;
        ubicacion: {
            lat: number;
            lng: number;
            direccion: string;
            comuna?: string;
        };
        ciudadano: {
            nombre: string;
            telefono: string;
            email: string;
            tipoDocumento?: string;
            numeroDocumento?: string;
            sujeto?: string;
        };
        estado?: PQRStatus;
        fechaVencimiento?: string;
        claseJuridica?: string;
        categoria?: string;
        evidenciaUrl?: string;
        tieneRespuesta?: boolean;
        observacionesInternas?: string;
        asignadoA?: string;
        coordinadorResponsable?: string;
    }): Promise<PQRType> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));

        const pqrs = this.getPQRsFromStorage();
        const tipoTramite = TIPOS_TRAMITE.find(tt => tt.id === data.tipotramiteId);
        const dependencia = DEPENDENCIAS.find(d => d.id === data.dependenciaId);

        const now = new Date();
        const diasSLA = tipoTramite?.diasSLA || 15;
        const fechaVencimiento = data.fechaVencimiento
            ? new Date(data.fechaVencimiento)
            : addDays(now, diasSLA);

        const initialStatus = data.estado || (data.dependenciaId ? (data.asignadoA ? 'EN_PROCESO' : 'POR_ASIGNAR') : 'NUEVA');
        const newPqr: PQRType = {
            id: `pqr-${Math.random().toString(36).substr(2, 9)}`,
            radicado: `${dependencia?.codigo || 'INF'}-2026-${(pqrs.length + 1).toString().padStart(4, '0')}`,
            fechaCreacion: format(now, "yyyy-MM-dd'T'HH:mm:ss"),
            fechaVencimiento: format(fechaVencimiento, "yyyy-MM-dd'T'HH:mm:ss"),
            estado: initialStatus,
            tipotramiteId: data.tipotramiteId,
            dependenciaId: data.dependenciaId,
            titulo: data.titulo,
            descripcion: data.descripcion,
            ubicacion: data.ubicacion,
            ciudadano: {
                ...data.ciudadano,
                tipoDocumento: data.ciudadano.tipoDocumento as any,
                sujeto: data.ciudadano.sujeto as any
            } as any,
            asignadoA: data.asignadoA,
            coordinadorResponsable: data.coordinadorResponsable,
            claseJuridica: data.claseJuridica,
            categoria: data.categoria,
            evidenciaUrl: data.evidenciaUrl,
            tieneRespuesta: data.tieneRespuesta || false,
            observacionesInternas: data.observacionesInternas
        };

        const updatedPqrs = [newPqr, ...pqrs];
        this.savePQRsToStorage(updatedPqrs);
        return newPqr;
    }

    static async updateStatus(id: string, estado: PQRStatus, response?: string): Promise<PQRType> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        const pqrs = this.getPQRsFromStorage();
        const index = pqrs.findIndex(p => p.id === id);
        if (index === -1) throw new Error('PQR not found');

        const updatedPqr = {
            ...pqrs[index],
            estado,
            respuesta: response || pqrs[index].respuesta,
            fechaCierre: (estado === 'RESUELTA' || estado === 'CERRADA') ? format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") : undefined
        };

        pqrs[index] = updatedPqr;
        this.savePQRsToStorage(pqrs);
        return updatedPqr;
    }

    static async assignTechnician(pqrId: string, tecnicoId: string): Promise<PQRType> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        const pqrs = this.getPQRsFromStorage();
        const index = pqrs.findIndex(p => p.id === pqrId);
        if (index === -1) throw new Error('PQR not found');

        const updatedPqr: PQRType = {
            ...pqrs[index],
            asignadoA: tecnicoId,
            estado: 'EN_PROCESO'
        };

        pqrs[index] = updatedPqr;
        this.savePQRsToStorage(pqrs);

        // Notificar al técnico
        const users = await UserService.getAll();
        const tecnico = users.find(u => u.id === tecnicoId);
        if (tecnico) {
            NotificationService.notifyTechnicianAssignment(tecnico, updatedPqr);
        }

        return updatedPqr;
    }

    static async assignToDependency(pqrId: string, dependenciaId: string, comuna?: string, tecnicoId?: string): Promise<PQRType> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        const pqrs = this.getPQRsFromStorage();
        const index = pqrs.findIndex(p => p.id === pqrId);
        if (index === -1) throw new Error('PQR not found');

        const updatedPqr: PQRType = {
            ...pqrs[index],
            dependenciaId,
            asignadoA: tecnicoId || pqrs[index].asignadoA,
            estado: tecnicoId ? 'EN_PROCESO' : 'POR_ASIGNAR',
            ubicacion: {
                ...pqrs[index].ubicacion,
                comuna: comuna || pqrs[index].ubicacion.comuna
            }
        };

        pqrs[index] = updatedPqr;
        this.savePQRsToStorage(pqrs);

        // Notificar al técnico si se ha auto-asignado uno
        if (tecnicoId) {
            const users = await UserService.getAll();
            const tecnico = users.find(u => u.id === tecnicoId);
            if (tecnico) {
                NotificationService.notifyTechnicianAssignment(tecnico, updatedPqr);
            }
        }

        return updatedPqr;
    }

    static async update(id: string, updatedData: Partial<PQRType>): Promise<PQRType> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        const pqrs = this.getPQRsFromStorage();
        const index = pqrs.findIndex(p => p.id === id);
        if (index === -1) throw new Error('PQR not found');

        const updatedPqr: PQRType = {
            ...pqrs[index],
            ...updatedData,
            id: pqrs[index].id, // Ensure ID doesn't change
            radicado: pqrs[index].radicado, // Ensure radicado doesn't change
            fechaCreacion: pqrs[index].fechaCreacion, // Ensure creation date doesn't change
        };

        pqrs[index] = updatedPqr;
        this.savePQRsToStorage(pqrs);
        return updatedPqr;
    }

    static async getByDependency(dependenciaId: string): Promise<PQRType[]> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        const pqrs = this.getPQRsFromStorage();
        return pqrs.filter(p => p.dependenciaId === dependenciaId);
    }

    static async saveFichaTecnica(pqrId: string, ficha: any): Promise<PQRType> {
        await new Promise(resolve => setTimeout(resolve, LATENCY));
        const pqrs = this.getPQRsFromStorage();
        const index = pqrs.findIndex(p => p.id === pqrId);
        if (index === -1) throw new Error('PQR not found');

        const updatedPqr: PQRType = {
            ...pqrs[index],
            fichaTecnica: ficha,
            estado: 'RESUELTA',
            fechaCierre: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
        };

        pqrs[index] = updatedPqr;
        this.savePQRsToStorage(pqrs);
        return updatedPqr;
    }
}
