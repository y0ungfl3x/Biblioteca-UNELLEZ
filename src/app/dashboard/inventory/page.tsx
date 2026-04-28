import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InventoryManager } from "./inventory-manager";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    availability?: string;
  }>;
}

const ITEMS_PER_PAGE = 10;

export default async function InventoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.q || "";
  const category = sp.category || "all";
  const availability = sp.availability || "all";
  const page = parseInt(sp.page || "1");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  
  if (profile?.role === "estudiante" || profile?.role === "invitado") {
    redirect("/dashboard");
  }

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("name").order("name");

  // Build query
  let supabaseQuery = supabase
    .from("catalog_view")
    .select("*", { count: "exact" });

  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,code.ilike.%${query}%`);
  }

  if (category !== "all") {
    supabaseQuery = supabaseQuery.eq("category", category);
  }

  if (availability === "physical") {
    supabaseQuery = supabaseQuery.gt("physical_total", 0);
  } else if (availability === "digital") {
    supabaseQuery = supabaseQuery.gt("ebooks_total", 0);
  } else if (availability === "none") {
    supabaseQuery = supabaseQuery.eq("physical_total", 0).eq("ebooks_total", 0);
  }

  const { data: books, count } = await supabaseQuery
    .order("title", { ascending: true })
    .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario de Libros</h1>
        <p className="text-slate-500 mt-1">Gestiona las copias físicas y versiones digitales (PDF) de cada libro.</p>
      </div>

      <InventoryManager 
        books={books || []} 
        categories={categories?.map(c => c.name) || []}
        totalCount={count || 0}
        currentPage={page}
        itemsPerPage={ITEMS_PER_PAGE}
        currentFilters={{ query, category, availability }}
      />
    </div>
  );
}
