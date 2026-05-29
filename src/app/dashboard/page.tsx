import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, HandHelping, Search, Clock } from "lucide-react";

export default async function DashboardIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isStaff =
    profile?.role === "administrador" || profile?.role === "bibliotecario";

  // Si es estudiante, obtener resumen de préstamos
  let activeLoansCount = 0;
  if (!isStaff) {
    const { count } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["solicitado", "aprobado", "entregado"]);
    activeLoansCount = count || 0;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            ¡Hola, {profile?.full_name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 mt-1">
            Bienvenido a tu panel de la{" "}
            <span className="font-bold text-orange-600">
              Biblioteca UNELLEZ
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {profile?.role}
          </span>
        </div>
      </div>

      {isStaff ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/inventory"
            className="group p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Gestión de Inventario
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Administra el catálogo, añade nuevas copias físicas y vincula
              documentos digitales.
            </p>
          </Link>
          <Link
            href="/dashboard/loans"
            className="group p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <HandHelping className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Control de Préstamos
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Aprueba solicitudes de estudiantes, registra entregas y recibe
              devoluciones de libros.
            </p>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="text-3xl font-black text-slate-900 mb-1">
                {activeLoansCount}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Préstamos Activos
              </div>
            </div>
            <Link
              href="/dashboard/explorer"
              className="md:col-span-2 group p-6 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-between overflow-hidden relative"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">Explorar Catálogo</h3>
                <p className="text-orange-100 text-sm">
                  Busca tu próximo libro entre miles de opciones.
                </p>
              </div>
              <div className="p-4 bg-orange-500 rounded-2xl group-hover:scale-110 transition-transform relative z-10">
                <Search className="w-6 h-6 text-white" />
              </div>
              <BookOpen className="absolute -bottom-4 -right-4 w-32 h-32 text-orange-500/20 rotate-12" />
            </Link>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Avisos Importantes
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Recuerda devolver a tiempo
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Los préstamos físicos tienen una duración de 7 días. Evita
                    sanciones entregando tus libros en la fecha indicada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
