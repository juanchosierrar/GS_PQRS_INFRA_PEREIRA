'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CreatePQRModal from '@/components/CreatePQRModal';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isPqrModalOpen, setIsPqrModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <html lang="es">
            <body className={inter.className}>
                <Providers>
                    <div className="flex h-screen bg-zinc-50/50 overflow-hidden">
                        {/* Static Sidebar */}
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                        />

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <Topbar
                                onNewPQR={() => setIsPqrModalOpen(true)}
                                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            />

                            <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth custom-scrollbar bg-slate-50/30">
                                <div className="max-w-[1600px] mx-auto">
                                    {children}
                                </div>

                                <footer className="mt-20 py-8 px-6 text-center text-[10px] text-zinc-400 border-t border-zinc-100 uppercase font-black tracking-widest">
                                    <div className="container mx-auto space-y-2">
                                        <p>ALCALDÍA DE PEREIRA - INFRAESTRUCTURA PARA TODOS</p>
                                        <p>&copy; 2026 InfraPQR v1.2 (ENTORNO DE PRUEBAS) - Desarrollo TICS</p>
                                    </div>
                                </footer>
                            </main>
                        </div>

                        {/* Global Modal */}
                        <CreatePQRModal
                            isOpen={isPqrModalOpen}
                            onClose={() => setIsPqrModalOpen(false)}
                        />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
