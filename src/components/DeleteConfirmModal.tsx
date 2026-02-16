'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    userRole: string;
    hasActivePQRs?: boolean;
    isDeleting?: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    userName,
    userRole,
    hasActivePQRs = false,
    isDeleting = false
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-8 pb-6 border-b border-zinc-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-rose-100 p-3 rounded-2xl">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">
                            Confirmar Eliminación
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-2 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-zinc-600">
                            ¿Estás seguro de que deseas eliminar a:
                        </p>
                        <div className="bg-zinc-50 rounded-2xl p-4 border-2 border-zinc-100">
                            <p className="text-lg font-black text-zinc-900">{userName}</p>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">
                                {userRole}
                            </p>
                        </div>
                    </div>

                    {hasActivePQRs && (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-amber-900 uppercase tracking-wide">
                                    Advertencia
                                </p>
                                <p className="text-sm font-semibold text-amber-800">
                                    Este usuario tiene PQRs activos asignados. Se recomienda reasignarlos antes de eliminar.
                                </p>
                            </div>
                        </div>
                    )}

                    <p className="text-sm font-semibold text-zinc-500">
                        Esta acción no se puede deshacer.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 p-8 pt-0">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-4 rounded-2xl border-2 border-zinc-200 font-black text-sm uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={cn(
                            "flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                            "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 hover:scale-[1.02] active:scale-95"
                        )}
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
