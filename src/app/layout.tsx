import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "InfraPQR - Gestión de infraestructura",
    description: "Plataforma de gestión de peticiones de infraestructura pública",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <Providers>
                    <div className="min-h-screen flex flex-col bg-zinc-50/50">
                        <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg sticky top-0 z-50">
                            <div className="container mx-auto flex justify-between items-center">
                                <div className="flex items-center gap-10">
                                    <Link href="/" className="flex items-center gap-2">
                                        <div className="bg-white p-1 rounded">
                                            <span className="text-primary font-black text-xs uppercase">Infra</span>
                                        </div>
                                        <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">PQR Pereira</h1>
                                    </Link>
                                    <nav className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-wider items-center">
                                        <Link href="/admin" className="opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">Estadísticas</Link>
                                        <Link href="/admin/inbox" className="opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">Control de Gestión</Link>

                                        {/* Dependencias Dropdown */}
                                        <div className="relative group">
                                            <Link href="/admin?tab=dependencias" className="opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1 group-hover:text-white">
                                                Dependencias
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </Link>
                                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-zinc-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                <div className="py-2">
                                                    <Link href="/admin?tab=dependencias" className="block px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors border-b border-zinc-50">
                                                        📊 Vista General de Control
                                                    </Link>
                                                    <div className="px-4 py-2 bg-zinc-50/50">
                                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Áreas de Gestión</span>
                                                    </div>
                                                    <Link href="/admin/dependencias/PAR" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        📍 Parques
                                                    </Link>
                                                    <Link href="/admin/dependencias/OBR" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        🏗️ Diseño de Obras
                                                    </Link>
                                                    <Link href="/admin/dependencias/TAL" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        🔧 Talleres
                                                    </Link>
                                                    <Link href="/admin/dependencias/PRI" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        📋 Secretaría Privada
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Técnicos Dropdown */}
                                        <div className="relative group">
                                            <Link href="/admin/tecnicos" className="opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1 group-hover:text-white">
                                                Técnicos
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </Link>
                                            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-zinc-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                <div className="py-2">
                                                    <Link href="/admin/tecnicos" className="block px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors border-b border-zinc-50">
                                                        👥 Vista General de Técnicos
                                                    </Link>
                                                    <div className="px-4 py-2 bg-zinc-50/50">
                                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Equipos por Dependencia</span>
                                                    </div>
                                                    <Link href="/admin/tecnicos?dep=dep-1" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        📍 Técnicos de Parques
                                                    </Link>
                                                    <Link href="/admin/tecnicos?dep=dep-2" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        🏗️ Diseño de Obras
                                                    </Link>
                                                    <Link href="/admin/tecnicos?dep=dep-3" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        🔧 Técnicos de Talleres
                                                    </Link>
                                                    <Link href="/admin/tecnicos?dep=dep-4" className="block px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                                        📋 Secretaría Privada
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </nav>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden lg:flex flex-col items-end border-r pr-6 border-white/10">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/60">Secretaría de Infraestructura</span>
                                        <span className="text-sm font-bold">Juan Administrador</span>
                                    </div>
                                    <Link href="/" className="text-sm border-2 border-white/20 px-4 py-1.5 rounded-lg hover:bg-white hover:text-primary font-bold transition-all">
                                        SALIR
                                    </Link>
                                </div>
                            </div>
                        </header>
                        <main className="flex-1 container mx-auto py-10 px-4">
                            {children}
                        </main>
                        <footer className="bg-white py-8 px-6 text-center text-xs text-muted-foreground border-t shadow-inner">
                            <div className="container mx-auto space-y-2">
                                <p className="font-bold text-zinc-400">ALCALDÍA DE PEREIRA - INFRAESTRUCTURA PARA TODOS</p>
                                <p>&copy; 2026 InfraPQR v1.2 (ENTORNO DE PRUEBAS) - Desarrollo TICS</p>
                            </div>
                        </footer>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
