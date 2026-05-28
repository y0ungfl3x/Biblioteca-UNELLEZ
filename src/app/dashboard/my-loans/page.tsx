import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyLoansClient } from "./my-loans-client";

export const dynamic = "force-dynamic";

export default async function MyLoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener datos iniciales del servidor (SSR para carga rápida)
  const [loansResponse, profileResponse] = await Promise.all([
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
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("status, suspended_until, full_name, cedula, email, phone")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <MyLoansClient
      initialLoans={loansResponse.data ?? []}
      initialProfile={profileResponse.data ?? null}
      userId={user.id}
    />
  );
}
