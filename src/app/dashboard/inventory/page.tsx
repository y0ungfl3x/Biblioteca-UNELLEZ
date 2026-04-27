import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InventoryManager } from "./inventory-manager";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  
  if (profile?.role === "estudiante" || profile?.role === "invitado") {
    redirect("/dashboard");
  }

  // Obtenemos el catálogo usando la vista
  const { data: books } = await supabase
    .from("catalog_view")
    .select("*")
    .order("title", { ascending: true });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario de Libros</h1>
        <p className="text-slate-500 mt-1">Gestiona las copias físicas y versiones digitales (PDF) de cada libro.</p>
      </div>

      <InventoryManager books={books || []} />
    </div>
  );
}
