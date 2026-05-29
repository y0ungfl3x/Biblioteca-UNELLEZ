import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // if exchange fails, send to an error page
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // No `code` present (e.g. password recovery uses fragment access_token).
  // Redirect to `next` so the client can read the URL fragment and finish the flow.
  return NextResponse.redirect(`${origin}${next}`);
}
