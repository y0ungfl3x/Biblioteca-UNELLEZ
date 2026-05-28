"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Book,
  Hash,
  Calendar,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { RenewButton } from "@/components/renew-button";
import { LoanReceipt } from "@/components/loan-receipt";
import { createClient } from "@/lib/supabase/client";
import React from "react";

interface Loan {
  id: string;
  user_id: string;
  copy_id: string;
  status: string;
  mode: string;
  requested_at: string;
  approved_at?: string | null;
  delivered_at?: string | null;
  due_at?: string | null;
  returned_at?: string | null;
  notes?: string | null;
  copy: {
    inventory_code: string;
    location: string;
    book: {
      title: string;
      code?: string | null;
      category?: {
        name: string;
      } | null;
    } | null;
  } | null;
  profile?: {
    full_name: string;
    cedula: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface Profile {
  status: string;
  suspended_until?: string | null;
  full_name?: string | null;
  cedula?: string | null;
  email?: string | null;
  phone?: string | null;
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  solicitado: {
    label: "Solicitado",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  aprobado: {
    label: "Aprobado para Retiro",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Calendar,
  },
  entregado: {
    label: "En mis manos",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Book,
  },
  devuelto: {
    label: "Devuelto",
    color: "bg-slate-100 text-slate-500 border-slate-200",
    icon: ArrowRight,
  },
  rechazado: {
    label: "Rechazado",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: ArrowRight,
  },
  vencido: {
    label: "Vencido",
    color: "bg-rose-100 text-rose-800 border-rose-300",
    icon: Clock,
  },
  multado: {
    label: "Multado",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: AlertTriangle,
  },
};

export function MyLoansClient({
  initialLoans,
  initialProfile,
  userId,
}: {
  initialLoans: Loan[];
  initialProfile: Profile | null;
  userId: string;
}) {
  const [loans, setLoans] = useState(initialLoans);
  const [profile, setProfile] = useState(initialProfile);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const isSuspended =
    profile?.status === "bloqueado" ||
    (profile?.suspended_until &&
      new Date() < new Date(profile.suspended_until));

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [loansRes, profileRes] = await Promise.all([
      supabase
        .from("loans")
        .select(
          `
          *,
          copy:physical_copies(
            inventory_code,
            location,
            book:books(title, code, category:categories(name))
          )
        `,
        )
        .eq("user_id", userId)
        .order("requested_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("status, suspended_until, full_name, cedula, email, phone")
        .eq("id", userId)
        .single(),
    ]);

    if (loansRes.data) setLoans(loansRes.data as unknown as Loan[]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();

    const interval = setInterval(fetchData, 5000);

    const loansChannel = supabase
      .channel("student-loans-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    const profileChannel = supabase
      .channel("student-profile-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(loansChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [userId, fetchData]);

  const selectedLoan =
    loans.find((loan) => loan.id === selectedLoanId) ?? null;

  const receiptLoan = selectedLoan
    ? {
        ...selectedLoan,
        profile:
          selectedLoan.profile ??
          (profile
            ? {
                full_name: profile.full_name ?? "",
                cedula: profile.cedula ?? "",
                email: profile.email ?? null,
                phone: profile.phone ?? null,
              }
            : null),
      }
    : null;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Mis Préstamos
        </h1>
        <p className="text-slate-500 mt-1">
          Sigue el estado de tus solicitudes y libros pendientes por devolver.
        </p>
      </div>

      {isSuspended && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="bg-rose-100 p-2 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-rose-800">Cuenta Suspendida</h3>
            <p className="text-sm text-rose-600 mt-1">
              Tienes una sanción activa por entrega tardía. No podrás solicitar
              ni renovar préstamos hasta el{" "}
              <strong>
                {profile?.suspended_until
                  ? new Date(profile.suspended_until).toLocaleDateString()
                  : "la fecha de reactivación"}
              </strong>
              .
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loans.map((loan) => {
          const config = statusConfig[loan.status] || {
            label: loan.status,
            color: "bg-gray-100 text-gray-700 border-gray-200",
            icon: Book,
          };
          const StatusIcon = config.icon;

          return (
            <div
              key={loan.id}
              onClick={() => setSelectedLoanId(loan.id)}
              className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                      config.color,
                    )}
                  >
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                          config.color,
                        )}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Ref: {loan.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-orange-600 transition-colors">
                      {loan.copy?.book?.title || "Libro no especificado"}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {loan.copy?.inventory_code}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Solicitado:{" "}
                        {new Date(loan.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {loan.status === "entregado" && loan.due_at && (
                    <div
                      className="flex flex-col md:items-end w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                        Fecha de Devolución
                      </span>
                      <div className="text-sm font-bold text-slate-900 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-center mb-3">
                        <Clock className="w-4 h-4 mr-2 text-rose-600" />
                        {new Date(loan.due_at).toLocaleDateString()}
                      </div>
                      <RenewButton
                        loanId={loan.id}
                        disabled={!!isSuspended}
                        tooltip={isSuspended ? "Cuenta suspendida" : ""}
                      />
                    </div>
                  )}

                  {loan.status === "aprobado" && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-100 text-xs font-bold flex items-center max-w-xs">
                      <Calendar className="w-4 h-4 mr-2" />
                      Pasa por la biblioteca a retirar tu libro.
                    </div>
                  )}

                  {loan.status === "solicitado" && (
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
                      Esperando aprobación...
                    </div>
                  )}

                  <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors self-end">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loans.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Aún no has pedido libros
            </h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
              Explora el catálogo y solicita tu primer préstamo físico.
            </p>
            <Link
              href="/dashboard/explorer"
              className="mt-6 inline-flex items-center text-orange-600 font-bold hover:gap-2 transition-all"
            >
              Ir al catálogo <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>

      {receiptLoan && (
        <LoanReceipt
          loan={receiptLoan}
          onClose={() => setSelectedLoanId(null)}
        />
      )}
    </div>
  );
}
