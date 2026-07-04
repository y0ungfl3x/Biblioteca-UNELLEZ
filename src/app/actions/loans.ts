"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { revalidatePath } from "next/cache";

export async function requestLoan(bookId: string) {
  const supabase = await createClient();

  // Usar el RPC atómico para evitar condiciones de carrera
  const { data, error: rpcError } = await supabase.rpc("rpc_request_loan", {
    p_book_id: bookId,
  });

  if (rpcError) {
    console.error("Error al llamar rpc_request_loan:", rpcError);
    return { error: "Error interno del servidor al procesar la solicitud" };
  }

  const result = data as {
    error?: string;
    success?: boolean;
    message?: string;
  };

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/my-loans");

  return {
    success: result.message || "¡Solicitud de préstamo enviada con éxito!",
  };
}

export async function updateLoanStatus(loanId: string, newStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isStaff = profile?.role === "administrador" || profile?.role === "bibliotecario";
  if (!profile || !isStaff)
    return { error: "No autorizado" };

  // Obtener los datos del préstamo actual antes de actualizar
  const { data: currentLoan, error: fetchError } = await supabase
    .from("loans")
    .select("due_at, user_id, copy_id, copy:physical_copies(book:books(title))")
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

        // Usar cliente admin para actualizar perfiles si es necesario
        const adminSupabase = await createClient(); // Si RLS lo permite, o createAdminClient() si no

        // 1. Cambiar estado de perfil a bloqueado y fijar suspended_until
        const { error: profileError } = await adminSupabase
          .from("profiles")
          .update({
            status: "bloqueado",
            suspended_until: suspendedUntil.toISOString(),
          })
          .eq("id", currentLoan.user_id);

        if (profileError) {
          console.error("Error al suspender al estudiante:", profileError);
          // Opcional: podrías decidir no fallar aquí para que al menos el libro se marque como devuelto/vencido
        }

        // 2. Registrar en public.audit_log con los días de mora
        const diffTime = Math.abs(returnedAt.getTime() - dueAtDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        await adminSupabase.from("audit_log").insert({
          actor_user_id: user.id,
          actor_role: profile?.role,
          action: "suspension_devolucion_tardia",
          entity: "profiles",
          entity_id: currentLoan.user_id,
          reason: `Entrega tardía de libro por ${diffDays} días. Suspensión de 1 mes hasta ${suspendedUntil.toLocaleDateString()}.`,
          before_data: { status: "activo", suspended_until: null },
          after_data: {
            status: "bloqueado",
            suspended_until: suspendedUntil.toISOString(),
          },
        });
      }
    }
  }

  const { error: updateLoanError } = await supabase
    .from("loans")
    .update(updatePayload)
    .eq("id", loanId);

  if (updateLoanError) {
    console.error("Error updating loan:", updateLoanError);
    return { error: "Error al actualizar el estado del préstamo" };
  }

  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/my-loans");
  revalidatePath("/");

  const statusLabels: Record<string, string> = {
    solicitado: "Solicitado",
    aprobado: "Aprobado",
    entregado: "Entregado",
    devuelto: "Devuelto",
    rechazado: "Rechazado",
    vencido: "Vencido",
    multado: "Multado",
  };

  const finalStatus = updatePayload.status;

  // Manejo seguro del título del libro basado en la estructura de Supabase (relación simple o array)
  const rawCopy = currentLoan.copy as any;
  const bookData = Array.isArray(rawCopy?.book)
    ? rawCopy.book[0]
    : rawCopy?.book;
  const bookTitle = bookData?.title || "tu libro";

  try {
    await sendPushToUser(currentLoan.user_id, {
      title: "Actualizacion de prestamo",
      body: `Tu prestamo de "${bookTitle}" cambio a ${
        statusLabels[finalStatus] || finalStatus
      }.`,
      url: "/dashboard/my-loans",
    });
  } catch {
    // Ignorar errores de push para no bloquear la operacion principal
  }

  return { success: true };
}

export async function renewLoan(loanId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para renovar un préstamo" };

  // 1. Obtener el préstamo
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*, copy:physical_copies(book_id)")
    .eq("id", loanId)
    .single();

  if (loanError || !loan) return { error: "Préstamo no encontrado" };
  if (loan.user_id !== user.id) return { error: "No autorizado" };
  if (loan.status !== "entregado")
    return { error: "Solo puedes renovar préstamos activos (entregados)" };

  // 2. Verificar estado del perfil del usuario (sanciones activas)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status, suspended_until, role")
    .eq("id", user.id)
    .single();

  if (profileError)
    return { error: "Error al verificar el perfil del usuario" };

  const isSuspended =
    profile.status === "bloqueado" ||
    (profile.suspended_until && new Date() < new Date(profile.suspended_until));

  if (isSuspended) {
    return {
      error:
        "No puedes renovar libros porque tienes una sanción activa en tu cuenta.",
    };
  }

  // 3. Verificar si el libro tiene reservas activas
  if (loan.copy?.book_id) {
    const { count: reservationsCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("book_id", loan.copy.book_id)
      .eq("status", "activa");

    if (reservationsCount && reservationsCount > 0) {
      return {
        error:
          "No puedes renovar este libro porque tiene reservas pendientes de otros estudiantes.",
      };
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
    actor_role: profile?.role || "estudiante",
    action: "renovacion_prestamo",
    entity: "loans",
    entity_id: loanId,
    reason: `Renovación por 3 días. Nueva fecha de vencimiento: ${currentDueAt.toLocaleDateString()}`,
  });

  revalidatePath("/dashboard/my-loans");
  return { success: "¡Préstamo renovado por 3 días adicionales!" };
}
