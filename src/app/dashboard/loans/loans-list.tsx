"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  BookDown,
  BookUp,
  Clock,
  User,
  Hash,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { updateLoanStatus } from "@/app/actions/loans";
import { LoanReceipt } from "@/components/loan-receipt";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";

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
  profile: {
    full_name: string;
    cedula: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  copy: {
    inventory_code: string;
    location: string;
    book: {
      title: string;
      code?: string | null;
      category?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

export function LoansList({
  initialLoans,
  initialTotal = 0,
  initialPageSize = 5,
}: {
  initialLoans: LoanWithRelations[];
  initialTotal?: number;
  initialPageSize?: number;
}) {
  const [loans, setLoans] = useState(initialLoans);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithRelations | null>(
    null,
  );
  const [confirmLateReturn, setConfirmLateReturn] = useState<{
    loan: LoanWithRelations;
    status: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  const fetchLoans = useCallback(
    async (opts?: {
      page?: number;
      status?: string;
      from?: string | null;
      to?: string | null;
    }) => {
      const supabase = createClient();
      const currentPage = opts?.page ?? page;
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from("loans")
        .select(
          `
          *,
          profile:profiles!loans_user_id_fkey(*),
          copy:physical_copies(
            inventory_code,
            location,
            book:books(title, code, category:categories(name))
          )
        `,
          { count: "exact" },
        )
        .order("requested_at", { ascending: false })
        .range(start, end);

      if (opts?.status) {
        query = query.eq("status", opts.status);
      }
      if (opts?.from) {
        query = query.gte("requested_at", opts.from);
      }
      if (opts?.to) {
        query = query.lte("requested_at", opts.to);
      }

      const { data, count } = await query;

      if (data) {
        setLoans(data as unknown as LoanWithRelations[]);
        setTotal(typeof count === "number" ? count : 0);
        // Pulso visual de "recibido dato en tiempo real"
        setLiveIndicator(true);
        setTimeout(() => setLiveIndicator(false), 1500);
      }
    },
    [page, pageSize],
  );

  useEffect(() => {
    const supabase = createClient();

    // Polling cada 5 segundos como respaldo confiable
    const interval = setInterval(
      () =>
        fetchLoans({ page, status: statusFilter, from: fromDate, to: toDate }),
      5000,
    );

    // Realtime como canal instantáneo (si está habilitado en Supabase)
    const channel = supabase
      .channel("librarian-loans-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        () => {
          fetchLoans({
            page,
            status: statusFilter,
            from: fromDate,
            to: toDate,
          });
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLoans, page, statusFilter, fromDate, toDate]);

  async function handleStatusUpdate(loan: LoanWithRelations, status: string) {
    if (status === "devuelto" && loan.due_at) {
      const dueAtDate = new Date(loan.due_at);
      if (new Date() > dueAtDate) {
        setConfirmLateReturn({ loan, status });
        return;
      }
    }

    setLoadingId(loan.id);
    const res = await updateLoanStatus(loan.id, status);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Estado actualizado con éxito.");
      // Refrescar la lista inmediatamente después de la acción
      await fetchLoans({
        page,
        status: statusFilter,
        from: fromDate,
        to: toDate,
      });
    }
    setLoadingId(null);
  }

  async function executeStatusUpdate(loan: LoanWithRelations, status: string) {
    setLoadingId(loan.id);
    const res = await updateLoanStatus(loan.id, status);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Estado actualizado con éxito.");
      await fetchLoans({
        page,
        status: statusFilter,
        from: fromDate,
        to: toDate,
      });
    }
    setLoadingId(null);
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    solicitado: {
      label: "Solicitado",
      color: "bg-amber-100 text-amber-700 border-amber-200",
    },
    aprobado: {
      label: "Aprobado",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    entregado: {
      label: "En Préstamo",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    devuelto: {
      label: "Devuelto",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    },
    rechazado: {
      label: "Rechazado",
      color: "bg-rose-100 text-rose-700 border-rose-200",
    },
    vencido: {
      label: "Vencido",
      color: "bg-rose-100 text-rose-800 border-rose-300",
    },
    multado: {
      label: "Multado",
      color: "bg-purple-100 text-purple-800 border-purple-300",
    },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Controles de filtros y paginación */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
              fetchLoans({
                page: 1,
                status: e.target.value || undefined,
                from: fromDate,
                to: toDate,
              });
            }}
            className="text-sm rounded-xl border px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="solicitado">Solicitado</option>
            <option value="aprobado">Aprobado</option>
            <option value="entregado">Entregado</option>
            <option value="devuelto">Devuelto</option>
            <option value="rechazado">Rechazado</option>
            <option value="vencido">Vencido</option>
            <option value="multado">Multado</option>
          </select>

          <input
            type="date"
            value={fromDate ?? ""}
            onChange={(e) => {
              setFromDate(e.target.value || null);
              setPage(1);
              fetchLoans({
                page: 1,
                status: statusFilter || undefined,
                from: e.target.value || null,
                to: toDate,
              });
            }}
            className="text-sm rounded-xl border px-3 py-2"
          />

          <input
            type="date"
            value={toDate ?? ""}
            onChange={(e) => {
              setToDate(e.target.value || null);
              setPage(1);
              fetchLoans({
                page: 1,
                status: statusFilter || undefined,
                from: fromDate,
                to: e.target.value || null,
              });
            }}
            className="text-sm rounded-xl border px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">Mostrando</div>
          <div className="font-semibold">{pageSize}</div>
          <div className="text-sm text-slate-500">por página</div>
        </div>
      </div>
      {/* Indicador Realtime */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        <span className="text-xs text-slate-400 font-medium">
          Actualizaciones en tiempo real
        </span>
        <span
          className={clsx(
            "flex items-center gap-1.5 text-xs font-semibold transition-all duration-500",
            liveIndicator ? "text-emerald-600" : "text-slate-400",
          )}
        >
          <span
            className={clsx(
              "w-2 h-2 rounded-full transition-colors duration-500",
              liveIndicator ? "bg-emerald-500 animate-pulse" : "bg-slate-300",
            )}
          />
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
              const config = statusConfig[loan.status] || {
                label: loan.status,
                color: "bg-gray-100",
              };

              return (
                <tr
                  key={loan.id}
                  className={clsx(
                    "transition-colors",
                    isLate
                      ? "bg-rose-50/30 hover:bg-rose-50/50"
                      : "hover:bg-slate-50/50",
                  )}
                >
                  <td
                    className="px-6 py-4 cursor-pointer group"
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {loan.profile?.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          C.I: {loan.profile?.cedula}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer group"
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <div className="font-medium text-slate-800 group-hover:text-orange-600 transition-colors">
                      {loan.copy?.book?.title}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center mt-0.5">
                      <Hash className="w-3 h-3 mr-1" />{" "}
                      {loan.copy?.inventory_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={clsx(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border w-fit",
                          config.color,
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
                            isLate ? "text-rose-600" : "text-slate-500",
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
                                  : "bg-slate-800 shadow-slate-200",
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

      {selectedLoan && (
        <LoanReceipt
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          isStaffView={true}
        />
      )}

      {confirmLateReturn && (
        <ConfirmModal
          isOpen={!!confirmLateReturn}
          title="¡Devolución Tardía Detectada!"
          description="Este libro se está devolviendo fuera de la fecha de vencimiento.

Al procesarlo, el sistema automáticamente:
1. Marcará el préstamo como 'Vencido'.
2. Suspenderá al estudiante por 1 mes.
3. Bloqueará su cuenta.

¿Confirmas la recepción con sanción?"
          confirmText="Sí, procesar sanción"
          cancelText="No, cancelar"
          isWarning={true}
          onClose={() => setConfirmLateReturn(null)}
          onConfirm={() => {
            executeStatusUpdate(
              confirmLateReturn.loan,
              confirmLateReturn.status,
            );
            setConfirmLateReturn(null);
          }}
        />
      )}

      {/* Vista Mobile (Cards) */}
      <div className="md:hidden divide-y divide-slate-100">
        {loans.map((loan) => {
          const isLate =
            loan.status === "entregado" &&
            loan.due_at &&
            new Date() > new Date(loan.due_at);
          const config = statusConfig[loan.status] || {
            label: loan.status,
            color: "bg-gray-100",
          };

          return (
            <div
              key={loan.id}
              className={clsx("p-4 space-y-3", isLate ? "bg-rose-50/30" : "")}
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
                      config.color,
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
                        isLate ? "text-rose-600" : "text-slate-500",
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
                            onClick={() => handleStatusUpdate(loan, "aprobado")}
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
                              : "bg-slate-800 shadow-slate-200",
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

      {/* Paginación */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="text-sm text-slate-500">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (page > 1) {
                const newPage = page - 1;
                setPage(newPage);
                fetchLoans({
                  page: newPage,
                  status: statusFilter || undefined,
                  from: fromDate,
                  to: toDate,
                });
              }
            }}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg border text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <div className="text-sm">
            {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <button
            onClick={() => {
              const maxPage = Math.max(1, Math.ceil(total / pageSize));
              if (page < maxPage) {
                const newPage = page + 1;
                setPage(newPage);
                fetchLoans({
                  page: newPage,
                  status: statusFilter || undefined,
                  from: fromDate,
                  to: toDate,
                });
              }
            }}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-3 py-1 rounded-lg border text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
