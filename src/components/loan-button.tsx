"use client";

import { useState } from "react";
import { HandHelping, Loader2 } from "lucide-react";
import { requestLoan } from "@/app/actions/loans";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";

export function LoanButton({ bookId, disabled, userLoggedIn }: { bookId: string, disabled: boolean, userLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRequest() {
    if (!userLoggedIn) {
      toast.error("Debes iniciar sesión para solicitar préstamos.");
      return;
    }
    if (loading) return;

    setShowConfirm(true);
  }

  async function executeRequest() {
    setLoading(true);
    const res = await requestLoan(bookId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.success || "Préstamo solicitado con éxito.");
    }
    setLoading(false);
  }

  const buttonText = !userLoggedIn 
    ? "Inicia sesión para solicitar" 
    : disabled 
      ? "No disponible" 
      : "Solicitar Préstamo";

  return (
    <>
      <button
        onClick={handleRequest}
        disabled={disabled && userLoggedIn && !loading}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold transition-all shadow-sm ${
          (disabled && userLoggedIn) 
            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
            : "bg-orange-600 hover:bg-orange-700 text-white hover:-translate-y-0.5 active:translate-y-0"
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandHelping className="w-4 h-4" />}
        <span>{buttonText}</span>
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeRequest}
        title="¿Solicitar Préstamo?"
        description="¿Confirmas que deseas solicitar el préstamo de este libro? Se registrará tu solicitud y el bibliotecario la procesará."
        confirmText="Confirmar Préstamo"
        cancelText="Cancelar"
      />
    </>
  );
}

