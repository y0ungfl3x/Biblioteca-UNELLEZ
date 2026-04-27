import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateUserForm } from "./create-user-form";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener rol del usuario actual
  const { data: currentUserProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching current user profile:", profileError);
  }

  if (currentUserProfile?.role === "estudiante" || currentUserProfile?.role === "invitado") {
    // Si no es admin o bibliotecario, no debería estar aquí
    redirect("/dashboard");
  }

  // Obtener lista de usuarios registrados
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
        <p className="text-slate-500 mt-1">Crea y administra cuentas de acceso al sistema bibliotecario.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Lateral */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Registrar Nuevo</h2>
            <CreateUserForm currentRole={currentUserProfile?.role} />
          </div>
        </div>

        {/* Tabla Central */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-4">Nombre / Cédula</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.full_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">C.I: {p.cedula}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        p.role === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        p.role === 'bibliotecario' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        p.status === 'activo' 
                          ? 'bg-slate-100 text-slate-700 border-slate-200' 
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
