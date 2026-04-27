import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardIndex() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 relative z-10">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido al Dashboard</h1>
      <p className="text-slate-600">
        Has ingresado como <strong className="text-orange-600 capitalize font-semibold">{profile?.role}</strong>.
      </p>
      
      <div className="p-6 bg-white border border-slate-200 rounded-2xl mt-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Panel de Control</h2>
        <p className="text-sm text-slate-600">
          Usa el menú lateral para navegar. Si eres administrador o bibliotecario, puedes gestionar las cuentas de usuario desde la sección "Usuarios".
        </p>
      </div>
    </div>
  );
}
