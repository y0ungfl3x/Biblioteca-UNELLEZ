"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, BookDown, BookUp, Clock, User, Hash, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { updateLoanStatus } from "@/app/actions/loans";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";
import { toast } from "sonner";

export interface LoanWithRelations {
  id: string;
  user_id: string;
  copy_id: string;
  status: string;
  mode: string;
  requested_at: string;
  approved_at?: string | null;
  delivered_at?: string | null;
  due_at?: string | null;
  returned_at?: string | null;
  notes?: string | null;
  profile?: {
    full_name: string;
    cedula: string;
  } | null;
  copy?: {
    inventory_code: string;
    book?: {
      title: string;
    } | null;
  } | null;
}

export function LoansList({ initialLoans }: { initialLoans: LoanWithRelations[] }) {
  const [loans, setLoans] = useState(initialLoans);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [liveIndicator, setLiveIndicator] = useState(false);

  const fetchLoans = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("loans")
      .select(`
        *,
        profile:profiles!loans_user_id_fkey(full_name, cedula),
        copy:physical_copies(
          inventory_code,
          book:books(title)
        )
      `)
      .order("requested_at", { ascending: false });

    if (data) {
      setLoans(data as LoanWithRelations[]);
      // Pulso visual de "recibido dato en tiempo real"
      setLiveIndicator(true);
      setTimeout(() => setLiveIndicator(false), 1500);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Polling cada 5 segundos como respaldo confiable
    const interval = setInterval(fetchLoans, 5000);

    // Realtime como canal instantáneo (si está habilitado en Supabase)
    const channel = supabase
      .channel("librarian-loans-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        () => {
          fetchLoans();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLoans]);

  async function handleStatusUpdate(loan: LoanWithRelations, status: string) {
    if (status === "devuelto" && loan.due_at) {
      const dueAtDate = new Date(loan.due_at);
      if (new Date() > dueAtDate) {
        const confirm = window.confirm(
          "¡ATENCIÓN!\n\nEste libro se está devolviendo fuera de la fecha de vencimiento.\n\nAl procesarlo, el sistema automáticamente:\n1. Cambiará el estado del préstamo a 'Vencido'.\n2. Sancionará al estudiante con 1 mes de suspensión.\n3. Bloqueará su cuenta.\n\n¿Deseas continuar con la recepción?"
        );
        if (!confirm) return;
      }
    }

    setLoadingId(loan.id);
    const res = await updateLoanStatus(loan.id, status);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Estado actualizado con éxito.");
      // Refrescar la lista inmediatamente después de la acción
      await fetchLoans();
    }
    setLoadingId(null);
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    solicitado: { label: "Solicitado", color: "bg-amber-100 text-amber-700 border-amber-200" },
    aprobado: { label: "Aprobado", color: "bg-blue-100 text-blue-700 border-blue-200" },
    entregado: { label: "En Préstamo", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    devuelto: { label: "Devuelto", color: "bg-slate-100 text-slate-600 border-slate-200" },
    rechazado: { label: "Rechazado", color: "bg-rose-100 text-rose-700 border-rose-200" },
    vencido: { label: "Vencido", color: "bg-rose-100 text-rose-800 border-rose-300" },
    multado: { label: "Multado", color: "bg-purple-100 text-purple-800 border-purple-300" },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Indicador Realtime */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        <span className="text-xs text-slate-400 font-medium">Actualizaciones en tiempo real</span>
        <span className={clsx(
          "flex items-center gap-1.5 text-xs font-semibold transition-all duration-500",
          liveIndicator ? "text-emerald-600" : "text-slate-400"
        )}>
          <span className={clsx(
            "w-2 h-2 rounded-full transition-colors duration-500",
            liveIndicator ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
          )} />
          {liveIndicator ? "Actualizado" : "Conectado"}
        </span>
      </div>

      {/* Vista Desktop (Tabla) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 md:min-w-full">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold">
            <tr>
              <th className="px-6 py-4">Estudiante</th>
              <th className="px-6 py-4">Libro / Copia</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((loan) => {
              const isLate =
                loan.status === "entregado" &&
                loan.due_at &&
                new Date() > new Date(loan.due_at);
              const config =
                statusConfig[loan.status] || { label: loan.status, color: "bg-gray-100" };

              return (
                <tr
                  key={loan.id}
                  className={clsx(
                    "transition-colors",
                    isLate
                      ? "bg-rose-50/30 hover:bg-rose-50/50"
                      : "hover:bg-slate-50/50"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {loan.profile?.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          C.I: {loan.profile?.cedula}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">
                      {loan.copy?.book?.title}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center mt-0.5">
                      <Hash className="w-3 h-3 mr-1" /> {loan.copy?.inventory_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={clsx(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border w-fit",
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                      {isLate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-rose-100 text-rose-800 border-rose-200 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Mora
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex flex-col text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(loan.requested_at).toLocaleDateString()}
                      </span>
                      {loan.due_at && loan.status === "entregado" && (
                        <span
                          className={clsx(
                            "mt-1 font-semibold",
                            isLate ? "text-rose-600" : "text-slate-500"
                          )}
                        >
                          Vence: {new Date(loan.due_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {loadingId === loan.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      ) : (
                        <>
                          {loan.status === "solicitado" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(loan, "aprobado")
                                }
                                title="Aprobar"
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(loan, "rechazado")
                                }
                                title="Rechazar"
                                className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {loan.status === "aprobado" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(loan, "entregado")
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-100 hover:bg-orange-700 transition-colors"
                            >
                              <BookDown className="w-4 h-4" /> Entregar
                            </button>
                          )}
                          {loan.status === "entregado" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(loan, "devuelto")
                              }
                              className={clsx(
                                "flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity",
                                isLate
                                  ? "bg-rose-600 shadow-rose-200"
                                  : "bg-slate-800 shadow-slate-200"
                              )}
                            >
                              <BookUp className="w-4 h-4" /> Recibir
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile (Cards) */}
      <div className="md:hidden divide-y divide-slate-100">
        {loans.map((loan) => {
          const isLate =
            loan.status === "entregado" &&
            loan.due_at &&
            new Date() > new Date(loan.due_at);
          const config =
            statusConfig[loan.status] || { label: loan.status, color: "bg-gray-100" };

          return (
            <div
              key={loan.id}
              className={clsx(
                "p-4 space-y-3",
                isLate ? "bg-rose-50/30" : ""
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {loan.profile?.full_name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      C.I: {loan.profile?.cedula}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={clsx(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                  {isLate && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-rose-100 text-rose-800 border-rose-200">
                      Mora
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 text-sm">
                  {loan.copy?.book?.title}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center mt-1 font-bold">
                  <Hash className="w-3 h-3 mr-1" /> {loan.copy?.inventory_code}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center">
                    <Clock className="w-3 h-3 mr-1" />{" "}
                    {new Date(loan.requested_at).toLocaleDateString()}
                  </div>
                  {loan.due_at && loan.status === "entregado" && (
                    <div
                      className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isLate ? "text-rose-600" : "text-slate-500"
                      )}
                    >
                      Vence: {new Date(loan.due_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {loadingId === loan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  ) : (
                    <>
                      {loan.status === "solicitado" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(loan, "aprobado")
                            }
                            disabled={loadingId === loan.id}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(loan, "rechazado")
                            }
                            disabled={loadingId === loan.id}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {loan.status === "aprobado" && (
                        <button
                          onClick={() => handleStatusUpdate(loan, "entregado")}
                          disabled={loadingId === loan.id}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-100"
                        >
                          <BookDown className="w-4 h-4" /> Entregar
                        </button>
                      )}

                      {loan.status === "entregado" && (
                        <button
                          onClick={() => handleStatusUpdate(loan, "devuelto")}
                          disabled={loadingId === loan.id}
                          className={clsx(
                            "flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md",
                            isLate
                              ? "bg-rose-600 shadow-rose-200"
                              : "bg-slate-800 shadow-slate-200"
                          )}
                        >
                          <BookUp className="w-4 h-4" /> Recibir
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loans.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          No hay solicitudes de préstamo registradas.
        </div>
      )}
    </div>
  );
}
