"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestLoan(bookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para solicitar un préstamo" };

  // Verificar si ya tiene préstamos activos o solicitudes pendientes
  const { count: activeLoans } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["solicitado", "aprobado", "entregado"]);

  if (activeLoans && activeLoans >= 5) {
    return { error: "Has alcanzado el límite máximo de préstamos activos (5)" };
  }

  // Buscar una copia disponible
  const { data: copy, error: copyError } = await supabase
    .from("physical_copies")
    .select("id")
    .eq("book_id", bookId)
    .eq("status", "disponible")
    .limit(1)
    .maybeSingle();

  if (copyError || !copy) {
    return { error: "No hay copias físicas disponibles en este momento" };
  }

  // Crear la solicitud de préstamo
  const { error: loanError } = await supabase.from("loans").insert({
    user_id: user.id,
    copy_id: copy.id,
    status: "solicitado",
    mode: "externa"
  });

  if (loanError) {
    console.error("Error al solicitar préstamo:", loanError);
    return { error: "No se pudo procesar la solicitud" };
  }

  // Marcar la copia como 'prestado' (o reservado para el proceso) 
  // En este sistema, lo marcamos como 'prestado' temporalmente para que nadie más lo pida
  await supabase.from("physical_copies").update({ status: "prestado" }).eq("id", copy.id);

  revalidatePath("/");
  revalidatePath("/dashboard/loans");
  
  return { success: "¡Solicitud de préstamo enviada con éxito!" };
}

export async function updateLoanStatus(loanId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "estudiante" || profile?.role === "invitado") return { error: "No autorizado" };

  interface UpdateLoanPayload {
    status: string;
    approved_at?: string;
    approved_by?: string;
    delivered_at?: string;
    delivered_by?: string;
    due_at?: string;
    returned_at?: string;
    received_by?: string;
  }

  const updatePayload: UpdateLoanPayload = { status: newStatus };

  if (newStatus === "aprobado") {
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.approved_by = user.id;
  } else if (newStatus === "entregado") {
    updatePayload.delivered_at = new Date().toISOString();
    updatePayload.delivered_by = user.id;
    // Calcular fecha de vencimiento (7 días por defecto)
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);
    updatePayload.due_at = dueAt.toISOString();
  } else if (newStatus === "devuelto") {
    updatePayload.returned_at = new Date().toISOString();
    updatePayload.received_by = user.id;
  } else if (newStatus === "rechazado") {
    // Si se rechaza, liberar la copia
    const { data: loan } = await supabase.from("loans").select("copy_id").eq("id", loanId).single();
    if (loan) {
      await supabase.from("physical_copies").update({ status: "disponible" }).eq("id", loan.copy_id);
    }
  }

  const { error } = await supabase.from("loans").update(updatePayload).eq("id", loanId);

  if (error) return { error: "Error al actualizar el estado" };

  // Si se devolvió, liberar la copia
  if (newStatus === "devuelto") {
    const { data: loan } = await supabase.from("loans").select("copy_id").eq("id", loanId).single();
    if (loan) {
      await supabase.from("physical_copies").update({ status: "disponible" }).eq("id", loan.copy_id);
    }
  }

  revalidatePath("/dashboard/loans");
  revalidatePath("/");
  return { success: true };
}

