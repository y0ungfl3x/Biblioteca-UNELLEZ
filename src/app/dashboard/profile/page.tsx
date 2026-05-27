  import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { User, Shield, CreditCard, Mail } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return <div className="p-8 text-red-500">No se pudo cargar el perfil.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-slate-500">Gestiona tus datos personales y de contacto en el sistema de biblioteca.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta Izquierda: Resumen */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border-4 border-orange-50 shadow-inner">
            <User className="w-12 h-12" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
              {profile.role}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-3 text-left text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Cédula</span>
                <span className="font-semibold text-slate-800">{profile.cedula}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Correo</span>
                <span className="font-semibold text-slate-800 truncate block" title={user.email}>{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Estado Cuenta</span>
                <span className="font-semibold text-slate-800 capitalize">{profile.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario Derecho: Editar detalles */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <ProfileForm initialProfile={profile} />
        </div>
      </div>
    </div>
  );
}
