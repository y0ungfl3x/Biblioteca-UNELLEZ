"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { renewLoan } from "@/app/actions/loans";
import { clsx } from "clsx";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";

export function RenewButton({ loanId, disabled, tooltip }: { loanId: string, disabled?: boolean, tooltip?: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRenew() {
    if (disabled || loading) return;
    setShowConfirm(true);
  }

  async function executeRenew() {
    setLoading(true);
    const res = await renewLoan(loanId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.success || "Préstamo renovado con éxito.");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleRenew}
        disabled={disabled || loading}
        title={tooltip}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-orange-100 hover:bg-orange-200 text-orange-700 hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        <span>Renovar Préstamo (+3 días)</span>
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeRenew}
        title="¿Renovar Préstamo?"
        description="¿Confirmas que deseas renovar el préstamo de este libro por 3 días más?"
        confirmText="Confirmar Renovación"
        cancelText="Cancelar"
      />
    </>
  );
}

