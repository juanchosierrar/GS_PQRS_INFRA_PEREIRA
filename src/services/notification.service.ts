import { Usuario, PQR } from '@/types';

export class NotificationService {
    /**
     * Simulates sending an email to a technician.
     */
    static async sendEmail(tecnico: Usuario, pqr: PQR) {
        console.log(`📧 ENVIANDO EMAIL A: ${tecnico.email}`);
        console.log(`Asunto: Nuevo radicado asignado - ${pqr.radicado}`);
        console.log(`Contenido: Hola ${tecnico.nombre}, se le ha asignado la solicitud: ${pqr.titulo}. Por favor revise su bandeja de entrada.`);

        // Simular latencia de red
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
    }

    /**
     * Simulates sending a WhatsApp message to a technician.
     */
    static async sendWhatsApp(tecnico: Usuario, pqr: PQR) {
        if (!tecnico.telefono) {
            console.warn(`⚠️ No hay teléfono registrado para ${tecnico.nombre}. No se pudo enviar WhatsApp.`);
            return false;
        }

        console.log(`📲 ENVIANDO WHATSAPP A: ${tecnico.telefono}`);
        console.log(`Mensaje: *InfraPQR Alerta:* Hola ${tecnico.nombre}, tienes un nuevo radicado (#${pqr.radicado}) pendiente de revisión. Ubicación: ${pqr.ubicacion.direccion}`);

        // Simular latencia de red
        await new Promise(resolve => setTimeout(resolve, 600));
        return true;
    }

    /**
     * Sends both email and WhatsApp notifications.
     */
    static async notifyTechnicianAssignment(tecnico: Usuario, pqr: PQR) {
        console.log(`--- INICIO DE NOTIFICACIONES PARA ${tecnico.nombre} ---`);
        const [emailSent, whatsappSent] = await Promise.all([
            this.sendEmail(tecnico, pqr),
            this.sendWhatsApp(tecnico, pqr)
        ]);
        console.log(`--- NOTIFICACIONES COMPLETADAS | Email: ${emailSent ? '✅' : '❌'} | WhatsApp: ${whatsappSent ? '✅' : '❌'} ---`);
        return { emailSent, whatsappSent };
    }
}
