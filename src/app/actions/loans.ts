"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestLoan(bookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para solicitar un préstamo" };

  // Obtener parámetros globales (límites)
  const { data: params } = await supabase
    .from("loan_parameters")
    .select("max_active_loans")
    .eq("id", 1)
    .single();

  const maxLoans = params?.max_active_loans || 3;

  // Verificar si ya tiene préstamos activos o solicitudes pendientes
  const { count: activeLoans } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["solicitado", "aprobado", "entregado", "vencido", "multado"]);

  if (activeLoans !== null && activeLoans >= maxLoans) {
    return { error: `Has alcanzado el límite máximo de préstamos activos (${maxLoans})` };
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
    return { error: loanError.message || "No se pudo procesar la solicitud" };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/my-loans");
  
  return { success: "¡Solicitud de préstamo enviada con éxito!" };
}

export async function updateLoanStatus(loanId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "estudiante" || profile?.role === "invitado") return { error: "No autorizado" };

  // Obtener los datos del préstamo actual antes de actualizar
  const { data: currentLoan, error: fetchError } = await supabase
    .from("loans")
    .select("due_at, user_id, copy_id")
    .eq("id", loanId)
    .single();

  if (fetchError || !currentLoan) {
    return { error: "No se encontró el préstamo" };
  }

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
    
    // Obtener la cantidad de días permitidos desde los parámetros
    const { data: params } = await supabase
      .from("loan_parameters")
      .select("loan_days")
      .eq("id", 1)
      .single();
    
    const loanDays = params?.loan_days || 3;
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + loanDays);
    updatePayload.due_at = dueAt.toISOString();
    
  } else if (newStatus === "devuelto") {
    const returnedAt = new Date();
    updatePayload.returned_at = returnedAt.toISOString();
    updatePayload.received_by = user.id;

    // Verificar si es una devolución tardía
    if (currentLoan.due_at) {
      const dueAtDate = new Date(currentLoan.due_at);
      if (returnedAt > dueAtDate) {
        // Devolución tardía! Aplicar sanción de 1 mes
        const suspendedUntil = new Date();
        suspendedUntil.setMonth(suspendedUntil.getMonth() + 1);

        // Cambiar estado a vencido
        updatePayload.status = "vencido";

        // 1. Cambiar estado de perfil a bloqueado y fijar suspended_until
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            status: "bloqueado",
            suspended_until: suspendedUntil.toISOString()
          })
          .eq("id", currentLoan.user_id);

        if (profileError) {
          console.error("Error al suspender al estudiante:", profileError);
        }

        // 2. Registrar en public.audit_log con los días de mora
        const diffTime = Math.abs(returnedAt.getTime() - dueAtDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        await supabase.from("audit_log").insert({
          actor_user_id: user.id,
          actor_role: profile?.role,
          action: "suspension_devolucion_tardia",
          entity: "profiles",
          entity_id: currentLoan.user_id,
          reason: `Entrega tardía de libro por ${diffDays} días. Suspensión de 1 mes hasta ${suspendedUntil.toLocaleDateString()}.`,
          before_data: { status: "activo", suspended_until: null },
          after_data: { status: "bloqueado", suspended_until: suspendedUntil.toISOString() }
        });
      }
    }
  }

  const { error } = await supabase.from("loans").update(updatePayload).eq("id", loanId);

  if (error) return { error: "Error al actualizar el estado" };

  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/my-loans");
  revalidatePath("/");
  return { success: true };
}

export async function renewLoan(loanId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para renovar un préstamo" };

  // 1. Obtener el préstamo
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*, copy:physical_copies(book_id)")
    .eq("id", loanId)
    .single();

  if (loanError || !loan) return { error: "Préstamo no encontrado" };
  if (loan.user_id !== user.id) return { error: "No autorizado" };
  if (loan.status !== "entregado") return { error: "Solo puedes renovar préstamos activos (entregados)" };

  // 2. Verificar estado del perfil del usuario (sanciones activas)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status, suspended_until")
    .eq("id", user.id)
    .single();

  if (profileError) return { error: "Error al verificar el perfil del usuario" };

  const isSuspended = 
    profile.status === "bloqueado" || 
    (profile.suspended_until && new Date() < new Date(profile.suspended_until));

  if (isSuspended) {
    return { error: "No puedes renovar libros porque tienes una sanción activa en tu cuenta." };
  }

  // 3. Verificar si el libro tiene reservas activas
  if (loan.copy?.book_id) {
    const { count: reservationsCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("book_id", loan.copy.book_id)
      .eq("status", "activa");

    if (reservationsCount && reservationsCount > 0) {
      return { error: "No puedes renovar este libro porque tiene reservas pendientes de otros estudiantes." };
    }
  }

  // 4. Procesar renovación (extender 3 días)
  const currentDueAt = loan.due_at ? new Date(loan.due_at) : new Date();
  currentDueAt.setDate(currentDueAt.getDate() + 3);

  const { error: updateError } = await supabase
    .from("loans")
    .update({ due_at: currentDueAt.toISOString() })
    .eq("id", loanId);

  if (updateError) return { error: "Error al intentar renovar el préstamo" };

  // Registrar en auditoría
  await supabase.from("audit_log").insert({
    actor_user_id: user.id,
    actor_role: "estudiante",
    action: "renovacion_prestamo",
    entity: "loans",
    entity_id: loanId,
    reason: `Renovación por 3 días. Nueva fecha de vencimiento: ${currentDueAt.toLocaleDateString()}`
  });

  revalidatePath("/dashboard/my-loans");
  return { success: "¡Préstamo renovado por 3 días adicionales!" };
}
