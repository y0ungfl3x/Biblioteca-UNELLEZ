import { createClient } from "@/lib/supabase/server";
import {
  BookOpen,
  Search,
  LogIn,
  LayoutDashboard,
  Download,
  Eye,
  FileText,
  HandHelping,
} from "lucide-react";
import Link from "next/link";
import { LoanButton } from "@/components/loan-button";
import { BookCover } from "@/components/book-cover";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const query = sp.q || "";
  const categoryFilter = sp.category || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener categorías únicas para los filtros
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  const uniqueCategories = Array.from(
    new Set(categoriesData?.map((c) => c.name).filter(Boolean)),
  );

  // Consultar catálogo con filtros
  let dbQuery = supabase
    .from("catalog_view")
    .select("*")
    .order("title", { ascending: true })
    .limit(50);

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }
  if (categoryFilter) {
    dbQuery = dbQuery.eq("category", categoryFilter);
  }

  const { data: books, error } = await dbQuery;

  if (error) {
    console.error("Error fetching catalog:", error);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-orange-200">
      {/* Navegación */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="UNELLEZ"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                UNELLEZ
              </span>
              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest leading-none mt-1">
                Biblioteca
              </span>
            </div>
          </Link>

          <div>
            {!user ? (
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>Acceder</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-sm font-semibold text-white bg-orange-600 px-5 py-2 rounded-xl hover:bg-orange-700 transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-md"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Panel de Control</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Buscador */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-slate-50 z-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-yellow-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Catálogo{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-500">
              Digital
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Encuentra libros físicos, trabajos de grado y documentos PDF
            descargables.
          </p>

          <form
            method="GET"
            action="/"
            className="max-w-2xl mx-auto relative group"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por título..."
              className="block w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-slate-900 placeholder-slate-400 text-lg"
            />
            {categoryFilter && (
              <input type="hidden" name="category" value={categoryFilter} />
            )}
          </form>
        </div>
      </section>

      {/* Filtros de Categoría */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-6 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/?q=${query}`}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${!categoryFilter ? "bg-orange-600 text-white" : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200"}`}
          >
            Todas
          </Link>
          {uniqueCategories.map((cat) => (
            <Link
              key={cat}
              href={`/?category=${encodeURIComponent(cat)}${query ? `&q=${query}` : ""}`}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${categoryFilter === cat ? "bg-orange-600 text-white" : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200"}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Cuadrícula de Libros */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books?.map((book, index) => (
            <div
              key={book.id}
              className="card-enter group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              style={{ "--enter-delay": `${Math.min(index, 8) * 50}ms` } as React.CSSProperties}
            >
              <div className="h-48 w-full relative bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col justify-end overflow-hidden group-hover:cursor-pointer">
                <BookCover
                  src={book.cover_image_path}
                  alt={`Portada de ${book.title}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-md text-xl font-bold text-slate-700 shadow-sm">
                    {book.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-4 -left-4 text-9xl font-black text-slate-900/[0.03] pointer-events-none select-none z-0">
                    {book.title.charAt(0).toUpperCase()}
                  </div>
                </BookCover>

                <div className="relative z-10 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                    {book.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 bg-white">
                <p className="text-xs font-bold tracking-wider text-orange-600 mb-1 uppercase">
                  {book.category || "General"}
                </p>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 font-medium">
                  {book.authors || "Autor desconocido"}
                </p>

                <div className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {book.is_reference ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        Referencia
                      </span>
                    ) : book.physical_available > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {book.physical_available}{" "}
                        {book.physical_available === 1
                          ? "Disponible"
                          : "Disponibles"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
                        Solo Lectura
                      </span>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                    {/* Botón de Préstamo Físico */}
                    {!book.is_reference && (
                      <LoanButton
                        bookId={book.id}
                        disabled={book.physical_available <= 0}
                        userLoggedIn={!!user}
                      />
                    )}

                    {book.ebooks_total > 0 && (
                      <div className="flex gap-2">
                        <Link
                          href={`/read/${book.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-orange-200"
                        >
                          <Eye className="w-3.5 h-3.5" /> Leer Online
                        </Link>
                        <Link
                          href={`/read/${book.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                          title="Ver Detalles y Descargar"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Link>
                      </div>
                    )}

                    {book.ebooks_total === 0 && book.is_reference && (
                      <button className="w-full flex items-center justify-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 cursor-not-allowed">
                        <FileText className="w-3.5 h-3.5" /> Solo Consulta en
                        Sala
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!books || books.length === 0) && (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">
              No se encontraron resultados
            </h3>
            <p className="text-slate-500 mt-2">
              Intenta buscar con otros términos o cambia de categoría.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
