"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import Link from "next/link";
import {
  Mail,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const result = await requestPasswordReset(formData);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(
        "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.",
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-8"
      >
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Recuperar Contraseña
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Ingresa tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña.
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

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 text-sm"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p>{success}</p>
            </motion.div>
          )}

          {!success && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 ml-1">
                  Correo Electrónico
                </label>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Enviar Enlace de Recuperación"
                )}
              </button>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
