"use client";

import { useState } from "react";
import { HandHelping, Loader2 } from "lucide-react";
import { requestLoan } from "@/app/actions/loans";

export function LoanButton({ bookId, disabled, userLoggedIn }: { bookId: string, disabled: boolean, userLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    if (!userLoggedIn) {
      alert("Debes iniciar sesión para solicitar préstamos.");
      return;
    }
    if (loading) return;
    setLoading(true);
    const res = await requestLoan(bookId);
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.success);
    }
    setLoading(false);
  }

  const buttonText = !userLoggedIn 
    ? "Inicia sesión para solicitar" 
    : disabled 
      ? "No disponible" 
      : "Solicitar Préstamo";

  return (
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
  );
}
