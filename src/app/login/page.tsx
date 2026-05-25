"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Lock, Mail, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result.error) {
      setError("Credenciales incorrectas. Por favor, intenta de nuevo.");
      setIsLoading(false);
    } else {
      router.push("/dashboard"); 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Fondo decorativo UNELLEZ */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-8">
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Catálogo</span>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <img src="/logo.png" alt="UNELLEZ" className="h-24 w-auto object-contain" />
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                UNELLEZ
              </h1>
              <p className="text-orange-600 font-bold uppercase tracking-[0.2em] text-[10px] -mt-1">
                Biblioteca Digital
              </p>
            </div>
            <p className="text-slate-500 text-xs text-center max-w-[200px] leading-relaxed">
              Ingresa tus credenciales institucionales para acceder
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="usuario@unellez.edu.ve"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
