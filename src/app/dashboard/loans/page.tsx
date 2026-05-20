import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoansList } from "./loans-list";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  
  if (profile?.role === "estudiante" || profile?.role === "invitado") {
    redirect("/dashboard");
  }

  // Obtener préstamos pendientes y activos
  const { data: loans } = await supabase
    .from("loans")
    .select(`
      *,
      profile:profiles(full_name, cedula),
      copy:physical_copies(
        inventory_code,
        book:books(title)
      )
    `)
    .order("requested_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Préstamos</h1>
        <p className="text-slate-500 mt-1">Aprueba solicitudes y gestiona la entrega/devolución de libros.</p>
      </div>

      <LoansList initialLoans={loans || []} />
    </div>
  );
}
