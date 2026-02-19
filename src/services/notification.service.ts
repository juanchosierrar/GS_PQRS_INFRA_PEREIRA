'use client';

import emailjs from '@emailjs/browser';
import { Usuario, PQR } from '@/types';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

const isConfigured = () => SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY &&
    !SERVICE_ID.includes('PEGA_TU') && !TEMPLATE_ID.includes('PEGA_TU') && !PUBLIC_KEY.includes('PEGA_TU');

export class NotificationService {
    /**
     * Sends a real email to the technician via EmailJS.
     */
    static async sendEmail(tecnico: Usuario, pqr: PQR): Promise<boolean> {
        console.log(`📧 ENVIANDO EMAIL A: ${tecnico.email}`);

        if (!isConfigured()) {
            console.warn('⚠️ EmailJS no está configurado. Revisando modo simulación.');
            console.log(`   Asunto: Nuevo radicado asignado - ${pqr.radicado}`);
            await new Promise(resolve => setTimeout(resolve, 800));
            return true; // Simulates success in dev mode
        }

        try {
            const templateParams = {
                to_name: tecnico.nombre,
                to_email: tecnico.email,
                radicado: pqr.radicado,
                titulo: pqr.titulo,
                descripcion: pqr.descripcion,
                direccion: pqr.ubicacion.direccion || 'No especificada',
                comuna: pqr.ubicacion.comuna || 'No especificada',
                fecha_vencimiento: new Date(pqr.fechaVencimiento).toLocaleDateString('es-CO', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }),
                estado: pqr.estado,
                link_sistema: typeof window !== 'undefined'
                    ? `${window.location.origin}/pqrs/admin/pqr/${pqr.id}`
                    : `https://lightgray-dugong-149164.hostingsite.com/pqrs/admin/pqr/${pqr.id}`,
            };

            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            console.log(`✅ Email enviado exitosamente a ${tecnico.email} | Status: ${response.status}`);
            return true;
        } catch (error) {
            console.error('❌ Error al enviar email via EmailJS:', error);
            return false;
        }
    }

    /**
     * Simulates sending a WhatsApp message to a technician.
     */
    static async sendWhatsApp(tecnico: Usuario, pqr: PQR): Promise<boolean> {
        if (!tecnico.telefono) {
            console.warn(`⚠️ No hay teléfono registrado para ${tecnico.nombre}. No se pudo enviar WhatsApp.`);
            return false;
        }

        console.log(`📲 SIMULANDO WHATSAPP A: ${tecnico.telefono}`);
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
