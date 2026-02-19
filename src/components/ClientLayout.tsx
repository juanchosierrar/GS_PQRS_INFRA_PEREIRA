'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CreatePQRModal from '@/components/CreatePQRModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isPqrModalOpen, setIsPqrModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Permite abrir el modal desde cualquier sub-componente vía CustomEvent
    useEffect(() => {
        const handleOpenModal = () => setIsPqrModalOpen(true);
        window.addEventListener('open-new-pqr-modal', handleOpenModal);
        return () => window.removeEventListener('open-new-pqr-modal', handleOpenModal);
    }, []);

    return (
        <div className="flex h-screen bg-zinc-50/50 overflow-hidden">
            {/* Sidebar estático */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Área principal */}
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

            {/* Modal Global */}
            <CreatePQRModal
                isOpen={isPqrModalOpen}
                onClose={() => setIsPqrModalOpen(false)}
            />
        </div>
    );
}
