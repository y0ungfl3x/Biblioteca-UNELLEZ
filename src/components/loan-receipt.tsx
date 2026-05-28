"use client";

import {
  Clock,
  Book,
  Calendar,
  User,
  Hash,
  MapPin,
  Phone,
  Tag,
  Mail,
  Info,
} from "lucide-react";
import { clsx } from "clsx";

interface LoanReceiptProps {
  loan: {
    id: string;
    status: string;
    requested_at: string;
    due_at?: string | null;
    approved_at?: string | null;
    delivered_at?: string | null;
    profile?: {
      full_name: string;
      cedula: string;
      email?: string | null;
      phone?: string | null;
    } | null;
    copy: {
      inventory_code: string;
      location: string;
      book?: {
        title: string;
        code?: string | null;
        category?: {
          name: string;
        } | null;
      } | null;
    } | null;
  };
  onClose: () => void;
  isStaffView?: boolean;
}

export function LoanReceipt({
  loan,
  onClose,
  isStaffView = false,
}: LoanReceiptProps) {
  const statusLabels: Record<string, string> = {
    solicitado: "Pendiente de Aprobación",
    aprobado: "Listo para Retiro",
    entregado: "Libro en Préstamo",
    devuelto: "Devolución Exitosa",
    vencido: "Préstamo Vencido",
    rechazado: "Solicitud Rechazada",
  };

  const statusColors: Record<string, string> = {
    solicitado: "text-amber-600 bg-amber-50 border-amber-200",
    aprobado: "text-blue-600 bg-blue-50 border-blue-200",
    entregado: "text-emerald-600 bg-emerald-50 border-emerald-200",
    devuelto: "text-slate-600 bg-slate-50 border-slate-200",
    vencido: "text-rose-600 bg-rose-50 border-rose-200",
    rechazado: "text-rose-600 bg-rose-50 border-rose-200",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Tipo Ticket */}

        <div className="p-8 pt-10 flex-1 overflow-y-auto space-y-6">
          {/* Estado del Préstamo */}
          <div
            className={clsx(
              "flex flex-col items-center p-4 rounded-2xl border-2 border-dashed text-center",
              statusColors[loan.status] ||
                "text-slate-600 bg-slate-50 border-slate-200",
            )}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
              Estado de la Solicitud
            </div>
            <div className="text-lg font-bold">
              {statusLabels[loan.status] || loan.status}
            </div>
            {loan.due_at && loan.status === "entregado" && (
              <div className="mt-2 text-xs font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Vence el {new Date(loan.due_at).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Info del Libro */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Información del Libro
              </label>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="font-bold text-slate-900 leading-tight mb-2">
                  {loan.copy?.book?.title || "Título no disponible"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Hash className="w-3.5 h-3.5 text-orange-500" />
                    <span>Copia: {loan.copy?.inventory_code || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span className="capitalize">
                      {loan.copy?.location?.replace("_", " ") ||
                        "No especificada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Book className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                      Código libro: {loan.copy?.book?.code || "No disponible"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Tag className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                      Categoría:{" "}
                      {loan.copy?.book?.category?.name || "No especificada"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info del Estudiante (Siempre visible para el bibliotecario, o reducida para el estudiante si quieres) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Datos del Estudiante
              </label>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Nombre completo
                    </div>
                    <div className="text-sm font-bold text-slate-900 break-words">
                      {loan.profile?.full_name || "Nombre no registrado"}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      C.I: {loan.profile?.cedula || "No registrada"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 break-words">
                    {loan.profile?.email || "Correo no registrado"}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {loan.profile?.phone || "Teléfono no registrado"}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Fecha Solicitud
                </div>
                <div className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(loan.requested_at).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Referencia ID
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-hidden text-ellipsis">
                  #{loan.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {!isStaffView && loan.status === "aprobado" && (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
                  Muestra este comprobante al bibliotecario para retirar tu
                  libro físico.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Cerrar Comprobante
            </button>
          </div>
        </div>

        {/* Footer decorativo de ticket */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
          <div className="w-24 h-1 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
