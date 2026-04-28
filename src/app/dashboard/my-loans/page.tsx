import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Book, Hash, Calendar, ArrowRight, User } from "lucide-react";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

export default async function MyLoansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener préstamos del estudiante actual
  const { data: loans } = await supabase
    .from("loans")
    .select(`
      *,
      copy:physical_copies(
        inventory_code,
        book:books(title, category_id, categories(name))
      )
    `)
    .eq("profile_id", user.id)
    .order("requested_at", { ascending: false });

  const statusConfig: any = {
    solicitado: { label: "Solicitado", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    aprobado: { label: "Aprobado para Retiro", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar },
    entregado: { label: "En mis manos", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Book },
    devuelto: { label: "Devuelto", color: "bg-slate-100 text-slate-500 border-slate-200", icon: ArrowRight },
    rechazado: { label: "Rechazado", color: "bg-rose-100 text-rose-700 border-rose-200", icon: ArrowRight },
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Préstamos</h1>
        <p className="text-slate-500 mt-1">Sigue el estado de tus solicitudes y libros pendientes por devolver.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loans?.map((loan) => {
          const config = statusConfig[loan.status];
          const StatusIcon = config.icon;

          return (
            <div key={loan.id} className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                    config.color
                  )}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className={clsx(
                        "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                        config.color
                      )}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Ref: {loan.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{loan.copy?.book?.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {loan.copy?.inventory_code}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Pedida: {new Date(loan.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {loan.status === 'entregado' && loan.due_at && (
                    <div className="flex flex-col md:items-end">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Fecha de Devolución</span>
                      <div className="text-sm font-bold text-slate-900 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-rose-600" />
                        {new Date(loan.due_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  
                  {loan.status === 'aprobado' && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-100 text-xs font-bold flex items-center max-w-xs">
                      <Calendar className="w-4 h-4 mr-2" />
                      Pasa por la biblioteca a retirar tu libro.
                    </div>
                  )}

                  {loan.status === 'solicitado' && (
                    <div className="text-slate-400 text-xs font-medium italic">
                      Esperando aprobación del bibliotecario...
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loans?.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Aún no has pedido libros</h3>
             <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Explora el catálogo y solicita tu primer préstamo físico.</p>
             <Link href="/dashboard/explorer" className="mt-6 inline-flex items-center text-orange-600 font-bold hover:gap-2 transition-all">
               Ir al catálogo <ArrowRight className="w-4 h-4 ml-1" />
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
