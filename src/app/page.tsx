'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, UserCircle, ClipboardList, ShieldCheck } from 'lucide-react';

export default function WelcomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 py-12">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
                    Bienvenido a <span className="text-primary">InfraPQR</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Sistema de Gestión de Peticiones de Infraestructura Pública.
                    Seleccione su portal de acceso para continuar.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4">
                {/* Portal Ciudadano */}
                <div className="group relative flex flex-col items-center p-8 bg-white border rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="p-4 bg-primary/10 rounded-full text-primary mb-6 group-hover:scale-110 transition-transform">
                        <ClipboardList className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Portal Ciudadano</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                        Reporte daños, consulte el estado de sus trámites y realice peticiones de infraestructura.
                    </p>
                    <button className="w-full py-3 px-6 bg-zinc-100 text-zinc-400 font-semibold rounded-xl cursor-not-allowed">
                        Próximamente
                    </button>
                </div>

                {/* Dashboard Administrativo */}
                <Link href="/admin" className="group relative flex flex-col items-center p-8 bg-white border rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="p-4 bg-primary/10 rounded-full text-primary mb-6 group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Administración</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                        Gestión centralizada de PQRs, asignación de tareas, reportes y supervisión de dependencias.
                    </p>
                    <div className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl text-center group-hover:bg-primary/90 transition-colors">
                        Ingresar Dashboard
                    </div>
                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-primary/40 border border-primary/20 px-2 py-0.5 rounded">
                        ADMIN
                    </div>
                </Link>

                {/* Panel Técnico */}
                <Link href="/tecnico" className="group relative flex flex-col items-center p-8 bg-white border rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="p-4 bg-primary/10 rounded-full text-primary mb-6 group-hover:scale-110 transition-transform">
                        <Users className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Panel Técnico</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                        Gestión de visitas de campo, registro de fotos, coordenadas GPS y cierre de radicados.
                    </p>
                    <div className="w-full py-3 px-6 border-2 border-primary text-primary font-semibold rounded-xl text-center group-hover:bg-primary group-hover:text-white transition-all">
                        Ingresar Tareas
                    </div>
                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 border border-emerald-600/20 px-2 py-0.5 rounded">
                        CAMPO
                    </div>
                </Link>
            </div>

            <div className="flex flex-col items-center gap-2 pt-8 border-t w-full max-w-sm justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Acceso seguro respaldado por Alcaldía de Pereira
                </div>
                <div className="text-[10px] text-muted-foreground/50 font-mono">
                    v1.0.1-deploy-check
                </div>
            </div>
        </div>
    );
}
