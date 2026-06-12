"use client";

import { useState } from "react";
import { createSystemUser } from "@/app/actions/auth";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { validateEmail, validateRequired, validateMinLength } from "@/lib/validation";

const inputBase =
  "w-full bg-white border rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 outline-none transition-all shadow-sm";
const inputOk =
  "border-slate-300 focus:ring-orange-500/50 focus:border-orange-500";
const inputBad =
  "border-red-300 focus:ring-red-500/40 focus:border-red-500";

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-xs text-red-600 ml-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}

export function CreateUserForm({ currentRole }: { currentRole?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [values, setValues] = useState({ cedula: "", full_name: "", phone: "", email: "", password: "" });
  const [touched, setTouched] = useState({ cedula: false, full_name: false, email: false, password: false });
  const [numericHint, setNumericHint] = useState({ cedula: false, phone: false });

  const errors = {
    cedula: validateRequired(values.cedula, "La cédula es obligatoria."),
    full_name: validateRequired(values.full_name, "El nombre completo es obligatorio."),
    email: validateEmail(values.email),
    password: validateMinLength(
      values.password,
      6,
      "La contraseña temporal es obligatoria.",
      "La contraseña debe tener al menos 6 caracteres.",
    ),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function setValue(name: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function markTouched(name: keyof typeof touched) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function handleNumericInput(name: "cedula" | "phone", raw: string) {
    const clean = raw.replace(/[^0-9]/g, "");
    setValue(name, clean);
    setNumericHint((h) => ({ ...h, [name]: clean !== raw }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasErrors) {
      setTouched({ cedula: true, full_name: true, email: true, password: true });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await createSystemUser(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: "Usuario creado correctamente" });
      (event.target as HTMLFormElement).reset();
      setValues({ cedula: "", full_name: "", phone: "", email: "", password: "" });
      setTouched({ cedula: false, full_name: false, email: false, password: false });
      setNumericHint({ cedula: false, phone: false });
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

  const passwordOk = values.password.length >= 6;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

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
          value={values.cedula}
          onChange={(e) => handleNumericInput("cedula", e.target.value)}
          onBlur={() => markTouched("cedula")}
          aria-invalid={!!(touched.cedula && errors.cedula)}
          className={`${inputBase} ${touched.cedula && errors.cedula ? inputBad : inputOk}`}
        />
        {numericHint.cedula && (
          <p className="text-xs text-amber-600 ml-1 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Solo se permiten números en la cédula.
          </p>
        )}
        {touched.cedula && errors.cedula && <FieldError id="cedula-error" message={errors.cedula} />}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Nombre Completo</label>
        <input
          name="full_name"
          required
          placeholder="Ej: María Pérez García"
          value={values.full_name}
          onChange={(e) => setValue("full_name", e.target.value)}
          onBlur={() => markTouched("full_name")}
          aria-invalid={!!(touched.full_name && errors.full_name)}
          className={`${inputBase} ${touched.full_name && errors.full_name ? inputBad : inputOk}`}
        />
        {touched.full_name && errors.full_name && <FieldError id="name-error" message={errors.full_name} />}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Teléfono</label>
        <input
          name="phone"
          inputMode="numeric"
          pattern="[0-9]+"
          title="Solo se permiten números"
          placeholder="Ej: 04121234567"
          value={values.phone}
          onChange={(e) => handleNumericInput("phone", e.target.value)}
          className={`${inputBase} ${inputOk}`}
        />
        {numericHint.phone && (
          <p className="text-xs text-amber-600 ml-1 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Solo se permiten números en el teléfono.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Correo Electrónico</label>
        <input
          name="email"
          type="email"
          required
          placeholder="usuario@unellez.edu.ve"
          value={values.email}
          onChange={(e) => setValue("email", e.target.value)}
          onBlur={() => markTouched("email")}
          aria-invalid={!!(touched.email && errors.email)}
          className={`${inputBase} ${touched.email && errors.email ? inputBad : inputOk}`}
        />
        {touched.email && errors.email && <FieldError id="user-email-error" message={errors.email} />}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 ml-1">Contraseña Temporal</label>
        <input
          name="password"
          type="text"
          required
          minLength={6}
          placeholder="Ej: temporal123"
          value={values.password}
          onChange={(e) => setValue("password", e.target.value)}
          onBlur={() => markTouched("password")}
          aria-invalid={!!(touched.password && errors.password)}
          className={`${inputBase} ${touched.password && errors.password ? inputBad : inputOk}`}
        />
        {values.password.length > 0 && (
          <p className={`text-xs ml-1 flex items-center gap-1 transition-colors ${passwordOk ? "text-emerald-600" : touched.password ? "text-red-600" : "text-slate-400"}`}>
            {passwordOk ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <Info className="w-3 h-3 shrink-0" />}
            Mínimo 6 caracteres {passwordOk && "✓"}
          </p>
        )}
        {touched.password && errors.password && values.password.length === 0 && (
          <FieldError id="password-error" message={errors.password} />
        )}
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
