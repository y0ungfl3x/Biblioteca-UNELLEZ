"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { renewLoan } from "@/app/actions/loans";
import { clsx } from "clsx";

export function RenewButton({ loanId, disabled, tooltip }: { loanId: string, disabled?: boolean, tooltip?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRenew() {
    if (disabled || loading) return;
    setLoading(true);
    const res = await renewLoan(loanId);
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.success);
    }
    setLoading(false);
  }

  return (
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
  );
}
