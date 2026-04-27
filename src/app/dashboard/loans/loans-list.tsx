"use client";

import { useState } from "react";
import { Check, X, BookDown, BookUp, Clock, User, Hash, Loader2 } from "lucide-react";
import { updateLoanStatus } from "@/app/actions/loans";

export function LoansList({ initialLoans }: { initialLoans: any[] }) {
  const [loans, setLoans] = useState(initialLoans);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleStatusUpdate(loanId: string, status: string) {
    setLoadingId(loanId);
    const res = await updateLoanStatus(loanId, status);
    if (res.error) {
      alert(res.error);
    } else {
      // Recargar localmente o dejar que revalidatePath haga su magia
      window.location.reload(); 
    }
    setLoadingId(null);
  }

  const statusConfig: any = {
    solicitado: { label: "Solicitado", color: "bg-amber-100 text-amber-700 border-amber-200" },
    aprobado: { label: "Aprobado", color: "bg-blue-100 text-blue-700 border-blue-200" },
    entregado: { label: "En Préstamo", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    devuelto: { label: "Devuelto", color: "bg-slate-100 text-slate-600 border-slate-200" },
    rechazado: { label: "Rechazado", color: "bg-rose-100 text-rose-700 border-rose-200" },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left text-slate-600">
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
          {loans.map((loan) => (
            <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{loan.profile?.full_name}</div>
                    <div className="text-xs text-slate-500">C.I: {loan.profile?.id_number}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-800">{loan.copy?.book?.title}</div>
                <div className="text-xs text-slate-500 flex items-center mt-0.5">
                  <Hash className="w-3 h-3 mr-1" /> {loan.copy?.inventory_code}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusConfig[loan.status]?.color}`}>
                  {statusConfig[loan.status]?.label}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-slate-600 text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1.5 text-slate-400" />
                  {new Date(loan.requested_at).toLocaleDateString()}
                </div>
                {loan.due_at && loan.status === 'entregado' && (
                  <div className="text-rose-600 text-[10px] font-bold mt-1">
                    Vence: {new Date(loan.due_at).toLocaleDateString()}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {loan.status === 'solicitado' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(loan.id, 'aprobado')}
                        disabled={loadingId === loan.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Aprobar Solicitud"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(loan.id, 'rechazado')}
                        disabled={loadingId === loan.id}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Rechazar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {loan.status === 'aprobado' && (
                    <button 
                      onClick={() => handleStatusUpdate(loan.id, 'entregado')}
                      disabled={loadingId === loan.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-all"
                    >
                      <BookDown className="w-4 h-4" />
                      Entregar Libro
                    </button>
                  )}

                  {loan.status === 'entregado' && (
                    <button 
                      onClick={() => handleStatusUpdate(loan.id, 'devuelto')}
                      disabled={loadingId === loan.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all"
                    >
                      <BookUp className="w-4 h-4" />
                      Recibir Devolución
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {loans.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          No hay solicitudes de préstamo registradas.
        </div>
      )}
    </div>
  );
}
