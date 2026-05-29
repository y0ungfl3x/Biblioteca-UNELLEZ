"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  // Obtener la URL base de la solicitud actual
  const { headers } = await import("next/headers");
  const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const redirectUrl = `${protocol}://${host}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    return {
      error: "No se pudo enviar el correo de recuperación. Inténtalo de nuevo.",
    };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function createSystemUser(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "No autorizado" };
  }

  // Verificar el rol del usuario actual
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "administrador" && profile.role !== "bibliotecario")
  ) {
    return { error: "No tienes permisos para crear usuarios" };
  }

  const role = formData.get("role") as string;

  // Regla de Negocio:
  // Administradores -> Solo pueden crear bibliotecarios.
  // Bibliotecarios -> Solo pueden crear estudiantes.
  if (profile.role === "administrador" && role !== "bibliotecario") {
    return {
      error: "Los administradores solo pueden registrar bibliotecarios",
    };
  }
  if (profile.role === "bibliotecario" && role !== "estudiante") {
    return { error: "Los bibliotecarios solo pueden registrar estudiantes" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cedula = formData.get("cedula") as string;
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  const adminClient = createAdminClient();

  // Se crea el usuario en Auth, y nuestro trigger en la BD insertará el perfil
  // con el rol correspondiente en public.profiles automáticamente.
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      cedula,
      full_name: fullName,
      role,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (phone) {
    await adminClient.from("profiles").update({ phone }).eq("id", data.user.id);
  }

  return { success: true, userId: data.user.id };
}
