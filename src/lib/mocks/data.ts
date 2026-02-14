import { Dependencia, TipoTramite, Usuario, PQR, PQRStatus } from '@/types';
import { addDays, subDays, format } from 'date-fns';

export const DEPENDENCIAS: Dependencia[] = [
    { id: 'dep-1', nombre: 'Dirección de Parques', codigo: 'PAR' },
    { id: 'dep-2', nombre: 'Diseño de Obras', codigo: 'OBR' },
    { id: 'dep-3', nombre: 'Dirección de Talleres', codigo: 'TAL' },
    { id: 'dep-4', nombre: 'Secretaría Privada', codigo: 'PRI' },
];

export const TIPOS_TRAMITE: TipoTramite[] = [
    { id: 'tt-1', nombre: 'Petición de Infraestructura', diasSLA: 15, tipo: 'PETICION' },
    { id: 'tt-2', nombre: 'Denuncia por Daños', diasSLA: 10, tipo: 'DENUNCIA' },
    { id: 'tt-3', nombre: 'Queja de Servicio', diasSLA: 15, tipo: 'QUEJA' },
    { id: 'tt-4', nombre: 'Reclamo Urgente', diasSLA: 5, tipo: 'RECLAMO' },
];

export const USUARIOS: Usuario[] = [
    { id: 'usr-1', nombre: 'Juan Administrador', email: 'admin@infrapqr.com', rol: 'ADMIN_GENERAL', cargo: 'Administrador de Sistema' },
    { id: 'usr-2', nombre: 'Ing. Carlos Diseño', email: 'carlos.obras@pereira.gov.co', rol: 'DIRECTOR_DEPENDENCIA', dependenciaId: 'dep-2', cargo: 'Director de Obras' },

    // Parques (dep-1)
    { id: 'usr-3', nombre: 'Téc. Pedro Parques', email: 'pedro.parques@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-1', cargo: 'Técnico Senior' },
    { id: 'usr-7', nombre: 'Téc. María Podas', email: 'maria.podas@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-1', cargo: 'Esp. Forestal' },
    { id: 'usr-8', nombre: 'Téc. Luis Jardines', email: 'luis.jardines@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-1', cargo: 'Técnico de Campo' },

    // Obras (dep-2)
    { id: 'usr-6', nombre: 'Téc. Roberto Obras', email: 'roberto.obras@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-2', cargo: 'Técnico Civil' },
    { id: 'usr-10', nombre: 'Téc. Clara Vigas', email: 'clara.vigas@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-2', cargo: 'Maestro de Obra' },
    { id: 'usr-11', nombre: 'Téc. Diego Planos', email: 'diego.planos@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-2', cargo: 'Inspector Técnico' },

    // Talleres (dep-3)
    { id: 'usr-4', nombre: 'Téc. Ana Talleres', email: 'ana.talleres@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-3', cargo: 'Mecánico Jefe' },
    { id: 'usr-13', nombre: 'Téc. Jorge Frenos', email: 'jorge.frenos@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-3', cargo: 'Mecánico de Pesados' },
    { id: 'usr-14', nombre: 'Téc. Mario Motores', email: 'mario.motores@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-3', cargo: 'Auxiliar de Taller' },

    // Privada (dep-4)
    { id: 'usr-5', nombre: 'Téc. Lucía Privada', email: 'lucia.privada@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-4', cargo: 'Enlace de Gestión' },
    { id: 'usr-16', nombre: 'Téc. Sonia Enlace', email: 'sonia.enlace@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-4', cargo: 'Analista de Datos' },
    { id: 'usr-17', nombre: 'Téc. Rafael Gestión', email: 'rafael.gestion@pereira.gov.co', rol: 'TECNICO', dependenciaId: 'dep-4', cargo: 'Gestor Administrativo' },
];

const today = new Date();

export const COMUNAS = ['Cuba', 'Centro', 'Villavicencio', 'Consota', 'San Joaquín', 'El Oso', 'Perla del Otún', 'Rocío'];

export const PQRS_MOCK: PQR[] = [
    // Vencidas (Rojo)
    {
        id: 'pqr-1',
        radicado: 'OBR-2026-001',
        fechaCreacion: format(subDays(today, 20), "yyyy-MM-dd'T'HH:mm:ss"),
        fechaVencimiento: format(subDays(today, 5), "yyyy-MM-dd'T'HH:mm:ss"),
        tipotramiteId: 'tt-1',
        dependenciaId: 'dep-2',
        estado: 'EN_PROCESO',
        titulo: 'Puente peatonal con fisuras estructurales',
        descripcion: 'Se observan grietas profundas en la base del puente peatonal de la Av. Sur.',
        ubicacion: { lat: 4.8133, lng: -75.6961, direccion: 'Av. Sur con Calle 50', comuna: 'Cuba' },
        ciudadano: { nombre: 'Pedro Pérez', telefono: '3001234567', email: 'pedro@gmail.com' },
        asignadoA: 'usr-6'
    },
    // Nuevas reales (Sin área - POR_ASIGNAR)
    {
        id: 'pqr-new-1',
        radicado: 'INF-2026-0020',
        fechaCreacion: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss"),
        fechaVencimiento: format(addDays(today, 14), "yyyy-MM-dd'T'HH:mm:ss"),
        tipotramiteId: 'tt-1',
        dependenciaId: '',
        estado: 'POR_ASIGNAR',
        titulo: 'Falta de iluminación en separador central',
        descripcion: 'Varios postes de luz no encienden en la Av. del Rio.',
        ubicacion: { lat: 4.8120, lng: -75.6940, direccion: 'Av. del Rio con Calle 20', comuna: 'Centro' },
        ciudadano: { nombre: 'Andrés Giraldo', telefono: '3123456789', email: 'andres@test.com' }
    },
    // Por vencer (Amarillo)
    {
        id: 'pqr-2',
        radicado: 'PAR-2026-002',
        fechaCreacion: format(subDays(today, 8), "yyyy-MM-dd'T'HH:mm:ss"),
        fechaVencimiento: format(addDays(today, 2), "yyyy-MM-dd'T'HH:mm:ss"),
        tipotramiteId: 'tt-2',
        dependenciaId: 'dep-1',
        estado: 'VISITA_PROGRAMADA',
        titulo: 'Árbol a punto de caer en Parque Olaya',
        descripcion: 'Un árbol frondoso presenta inclinación peligrosa.',
        ubicacion: { lat: 4.8145, lng: -75.6946, direccion: 'Parque Olaya Herrera', comuna: 'Centro' },
        ciudadano: { nombre: 'María Lopez', telefono: '3117654321', email: 'maria@outlook.com' },
        asignadoA: 'usr-3'
    },
    ...Array.from({ length: 40 }).map((_, i) => {
        const dIdx = i % 4;
        const ttIdx = i % 4;
        const dep = DEPENDENCIAS[dIdx];
        const dId = i % 8 === 0 ? '' : dep.id; // Fewer unassigned items now
        const ttId = TIPOS_TRAMITE[ttIdx].id;
        const comuna = COMUNAS[i % COMUNAS.length];

        const creationDate = subDays(today, 5 + i);
        const expirationDate = addDays(creationDate, TIPOS_TRAMITE[ttIdx].diasSLA);

        // Logic sync: if no dId -> POR_ASIGNAR
        let estado: PQRStatus = 'EN_PROCESO';
        if (!dId) estado = 'POR_ASIGNAR';
        else if (i % 3 === 0) estado = 'RESUELTA';
        else if (i % 10 === 0) estado = 'VENCIDA';
        else if (i % 4 === 0) estado = 'VISITA_PROGRAMADA';

        // Assign to one of the 3 technicians of that dependency
        let asignadoA: string | undefined = undefined;
        if (dId) {
            const tecs = USUARIOS.filter(u => u.dependenciaId === dId && u.rol === 'TECNICO');
            asignadoA = tecs[i % tecs.length]?.id;
        }

        return {
            id: `pqr-auto-${i}`,
            radicado: `${dId ? dep.codigo : 'INF'}-2026-0${100 + i}`,
            fechaCreacion: format(creationDate, "yyyy-MM-dd'T'HH:mm:ss"),
            fechaVencimiento: format(expirationDate, "yyyy-MM-dd'T'HH:mm:ss"),
            tipotramiteId: ttId,
            dependenciaId: dId,
            estado,
            titulo: `Incidencia en área de ${dep.nombre} (${i})`,
            descripcion: `Reporte ciudadano recibido para el sector de ${comuna}. Se requiere inspección inmediata por parte del equipo de ${dep.nombre}.`,
            ubicacion: { lat: 4.81 + (i * 0.0005), lng: -75.69 - (i * 0.0005), direccion: `Carrera ${i % 15} # ${i + 1}`, comuna },
            ciudadano: { nombre: `Usuario Reporte ${i}`, telefono: `3150000${i.toString().padStart(3, '0')}`, email: `ciudadano.${i}@mail.com` },
            asignadoA
        } as PQR;
    })
];
