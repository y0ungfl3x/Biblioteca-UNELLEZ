import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const subscription = await request.json();
  const endpoint = subscription?.endpoint;
  const keys = subscription?.keys;

  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    return NextResponse.json(
      { error: "Suscripcion invalida" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      keys,
      subscription,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
