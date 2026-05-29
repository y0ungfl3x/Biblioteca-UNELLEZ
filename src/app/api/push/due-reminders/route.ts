import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const incoming = request.headers.get("x-cron-secret");
    if (incoming !== secret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = Date.now();
  // Ampliamos la ventana para la prueba:
  // Buscar préstamos que vencen en las próximas 30 horas (para cubrir todo el día de mañana)
  const windowHours = 30;
  const from = new Date(now).toISOString(); // Desde ahora
  const to = new Date(now + windowHours * 60 * 60 * 1000).toISOString(); // Hasta dentro de 30 horas

  const { data: loans } = await admin
    .from("loans")
    .select("id, user_id, due_at, copy:physical_copies(book:books(title))")
    .eq("status", "entregado")
    .gte("due_at", from)
    .lte("due_at", to);

  if (!loans || loans.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  let sent = 0;

  for (const loan of loans) {
    const { error: insertError } = await admin
      .from("push_notifications")
      .insert({
        user_id: loan.user_id,
        loan_id: loan.id,
        type: "due_24h",
        payload: { due_at: loan.due_at },
      });

    if (insertError) {
      continue;
    }

    const title = "Recordatorio de devolucion";
    const rawCopy = loan.copy as any;
    const bookData = Array.isArray(rawCopy?.book)
      ? rawCopy.book[0]
      : rawCopy?.book;
    const bookTitle = bookData?.title || "tu libro";
    const body = `Tu prestamo de "${bookTitle}" vence en 24 horas.`;

    await sendPushToUser(loan.user_id, {
      title,
      body,
      url: "/dashboard/my-loans",
    });

    sent += 1;
  }

  return NextResponse.json({ success: true, sent });
}
