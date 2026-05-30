"use client";

import { useState } from "react";
import { createSystemUser } from "@/app/actions/auth";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateUserForm({ currentRole }: { currentRole?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await createSystemUser(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: "Usuario creado correctamente" });
      (event.target as HTMLFormElement).reset();
      router.refresh(); 
    }
    setIsLoading(false);
  }

  // Regla de Negocio: 
  // Administradores -> Solo pueden crear bibliotecarios.
  // Bibliotecarios -> Solo pueden crear estudiantes.
  const availableRoles = currentRole === 'administrador' 
    ? ['bibliotecario']
    : ['estudiante'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {message && (
        <div className={`p-3 rounded-lg flex items-center space-x-2 text-sm border font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Cédula</label>
        <input
          name="cedula"
          required
          inputMode="numeric"
          pattern="[0-9]+"
          title="Solo se permiten números"
          placeholder="Ej: 12345678"
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Nombre Completo</label>
        <input name="full_name" required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm" />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Teléfono</label>
        <input
          name="phone"
          inputMode="numeric"
          pattern="[0-9]+"
          title="Solo se permiten números"
          placeholder="Ej: 04121234567"
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Correo Electrónico</label>
        <input name="email" type="email" required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm" />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Contraseña Temporal</label>
        <input name="password" type="text" required minLength={6} placeholder="Ej: temporal123" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-sm" />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Rol a Asignar</label>
        <select name="role" required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none capitalize transition-all shadow-sm appearance-none">
          {availableRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 flex items-center justify-center py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Usuario"}
      </button>
    </form>
  );
}
