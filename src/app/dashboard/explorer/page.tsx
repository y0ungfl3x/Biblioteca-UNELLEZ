import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { LoanButton } from "@/components/loan-button";
import { BookCover } from "@/components/book-cover";

export const dynamic = "force-dynamic";

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  // Base query
  let queryBuilder = supabase
    .from("catalog_view")
    .select("*");

  if (q) {
    queryBuilder = queryBuilder.ilike("title", `%${q}%`);
  }

  if (category && category !== "all") {
    queryBuilder = queryBuilder.eq("category", category);
  }

  const { data: books } = await queryBuilder.order("title");

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Explorar Biblioteca</h1>
        <p className="text-slate-500 mt-1">Busca y solicita libros físicos o lee versiones digitales.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <form className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por título o autor..."
            className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-sm"
          />
        </form>
        <form className="flex gap-2">
           <select 
            name="category"
            defaultValue={category || "all"}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-sm min-w-[180px]"
          >
            <option value="all">Todas las categorías</option>
            {categories?.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
            Filtrar
          </button>
        </form>
      </div>

      {/* Grid de Libros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books?.map((book, index) => (
          <div
            key={book.id}
            className="card-enter group flex flex-col bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            style={{ "--enter-delay": `${Math.min(index, 8) * 50}ms` } as React.CSSProperties}
          >
            <div className="aspect-[3/4] rounded-2xl bg-slate-50 mb-5 overflow-hidden relative shadow-inner">
              <BookCover
                src={book.cover_image_path}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sin Portada</span>
                </div>
              </BookCover>
              {/* Badge Digital */}
              {book.ebooks_total > 0 && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                  E-BOOK
                </div>
              )}
            </div>

            <div className="space-y-1 mb-5">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">
                {book.category}
              </span>
              <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                {book.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1 italic">{book.authors}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-50 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Físico</span>
                <span className={clsx(
                  "text-xs font-black",
                  book.physical_available > 0 ? "text-emerald-600" : "text-rose-500"
                )}>
                  {book.physical_available > 0
                    ? `${book.physical_available} ${book.physical_available === 1 ? "Disponible" : "Disponibles"}`
                    : "Agotado"}
                </span>
              </div>

              <div className="flex gap-2">
                 <div className="flex-1">
                   <LoanButton bookId={book.id} disabled={book.physical_available <= 0} userLoggedIn={true} />
                 </div>
                 {book.ebooks_total > 0 && (
                    <Link
                      href={`/read/${book.id}`}
                      className="flex items-center p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                      title="Leer Online"
                    >
                      <BookOpen className="w-5 h-5" />
                    </Link>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {books?.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
             <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No encontramos lo que buscas</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">Prueba ajustando los filtros o buscando con un término diferente.</p>
        </div>
      )}
    </div>
  );
}
