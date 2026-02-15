export type UserRole = 'ADMIN_GENERAL' | 'DIRECTOR_DEPENDENCIA' | 'TECNICO' | 'CIUDADANO';

export interface Dependencia {
    id: string;
    nombre: string;
    codigo: string;
}

export interface Usuario {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    whatsapp?: string;
    rol: UserRole;
    dependenciaId?: string;
    cargo: string;
}

export type PQRStatus = 'NUEVA' | 'POR_ASIGNAR' | 'EN_PROCESO' | 'VISITA_PROGRAMADA' | 'RESUELTA' | 'DEVUELTA' | 'CERRADA' | 'VENCIDA';
export type PQRType = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA' | 'DENUNCIA';
export type TipoDocumento = 'CC' | 'CE' | 'TI' | 'NIT' | 'Pasaporte';
export type SujetoSolicitante = 'Ciudadanía (General)' | 'Senador / Representante' | 'Concejal' | 'Diputado' | 'Entidad de Control' | 'Defensoría del Pueblo' | 'Periodista';

export interface TipoTramite {
    id: string;
    nombre: string;
    diasSLA: number;
    tipo: PQRType;
}

export interface FichaTecnica {
    fotoAntes?: string;
    fotoDespues?: string;
    coordenadas: {
        lat: number;
        lng: number;
    };
    nombreRecibe: string;
    telefonoVisita: string;
    direccionVisita: string;
    observaciones: string;
    analisisTecnico: string;
    fechaVisita: string;
}

export interface PQR {
    id: string;
    radicado: string;
    fechaCreacion: string;
    fechaVencimiento: string;
    tipotramiteId: string;
    dependenciaId: string;
    estado: PQRStatus;
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
        tipoDocumento?: TipoDocumento;
        numeroDocumento?: string;
        sujeto?: SujetoSolicitante;
    };
    asignadoA?: string; // ID del Técnico
    fotos?: string[];
    respuesta?: string;
    fechaCierre?: string;
    claseJuridica?: string;
    categoria?: string;
    evidenciaUrl?: string;
    tieneRespuesta?: boolean;
    observacionesInternas?: string;
    coordinadorResponsable?: string;
    fichaTecnica?: FichaTecnica;
}
