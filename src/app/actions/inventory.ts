"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPhysicalCopies(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Verificar rol (solo admin o bibliotecario)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "estudiante" || profile?.role === "invitado") {
    return { error: "Permisos insuficientes" };
  }

  const bookId = formData.get("bookId") as string;
  const quantityStr = formData.get("quantity") as string;
  const condition = formData.get("condition") as string || "bueno";

  if (!bookId) return { error: "ID del libro requerido" };
  
  const quantity = parseInt(quantityStr, 10);
  if (isNaN(quantity) || quantity <= 0 || quantity > 50) {
    return { error: "Cantidad inválida. Debe ser entre 1 y 50." };
  }

  // Crear N copias
  const copies = [];
  for (let i = 0; i < quantity; i++) {
    const randomCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    copies.push({
      book_id: bookId,
      inventory_code: `PHY-${bookId.substring(0, 4).toUpperCase()}-${randomCode}`,
      status: "disponible",
      condition_note: condition,
    });
  }

  const { error } = await supabase.from("physical_copies").insert(copies);

  if (error) {
    console.error(error);
    return { error: "Error al registrar el inventario" };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function linkEbook(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "estudiante" || profile?.role === "invitado") {
    return { error: "Permisos insuficientes" };
  }

  const bookId = formData.get("bookId") as string;
  const url = formData.get("url") as string;

  if (!bookId || !url) return { error: "Datos incompletos" };

  // Inactivar posibles ebooks anteriores para este libro
  await supabase.from("ebooks").update({ is_active: false }).eq("book_id", bookId);

  // Insertar el nuevo
  const { error } = await supabase.from("ebooks").insert({
    book_id: bookId,
    storage_path: url,
    filesize_bytes: 1048576, // dummy 1MB
    format: url.endsWith('.epub') ? 'epub' : 'pdf',
    is_active: true
  });

  if (error) {
    console.error(error);
    return { error: "Error al enlazar el E-Book" };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/inventory");
  return { success: true };
}
