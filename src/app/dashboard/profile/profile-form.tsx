"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Loader2, Save, User, Phone, Lock } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  cedula: string;
  full_name: string;
  role: string;
  phone: string | null;
}

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await updateProfile(formData);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.success || "Perfil actualizado con éxito.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900">Información del Perfil</h3>
        <p className="text-xs text-slate-500">Actualiza tus datos públicos de contacto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Nombre Completo</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="full_name"
              type="text"
              required
              defaultValue={initialProfile.full_name}
              className="w-full pl-10 bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm font-semibold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Teléfono de Contacto</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="phone"
              type="tel"
              placeholder="+58 412-1234567"
              defaultValue={initialProfile.phone || ""}
              className="w-full pl-10 bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Cédula <Lock className="w-3 h-3" />
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={initialProfile.cedula}
            className="w-full bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed rounded-xl px-4 py-2 text-sm outline-none font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Rol de Cuenta <Lock className="w-3 h-3" />
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={initialProfile.role}
            className="w-full bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed rounded-xl px-4 py-2 text-sm outline-none capitalize font-bold"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Guardar Cambios</span>
        </button>
      </div>
    </form>
  );
}
