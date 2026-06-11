import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { PdfViewer } from "@/components/pdf-viewer";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar información del libro
  const { data: book } = await supabase
    .from("books")
    .select("title, authors:book_authors(author:authors(full_name))")
    .eq("id", id)
    .single();

  if (!book) redirect("/");

  // Buscar el PDF activo
  const { data: ebook } = await supabase
    .from("ebooks")
    .select("storage_path")
    .eq("book_id", id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!ebook || !ebook.storage_path) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Archivo no disponible</h2>
          <p className="text-slate-500 mb-6">El documento digital para este libro no se encontró o fue deshabilitado.</p>
          <Link href="/" className="inline-flex items-center justify-center py-2 px-4 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors w-full">
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  interface BookAuthorRelation {
    author: {
      full_name: string;
    } | null;
  }

  // Generar cadena de autores
  const authorsList = (book.authors as unknown as BookAuthorRelation[])
    ?.map((a) => a.author?.full_name)
    .filter(Boolean)
    .join(", ") || "Autor desconocido";

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header oscuro tipo Lector */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
          <div className="truncate max-w-[200px] sm:max-w-md">
            <h1 className="text-white font-bold text-sm truncate">{book.title}</h1>
            <p className="text-slate-500 text-xs truncate">{authorsList}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-flex">
            Modo Lectura
          </span>
        </div>
      </header>

      {/* Visor de PDF (Iframe) */}
      <main className="flex-1 bg-slate-900 relative">
        <PdfViewer
          src={`${ebook.storage_path}#toolbar=0&navpanes=0&scrollbar=0`}
          title={`Lector PDF - ${book.title}`}
        />
      </main>
    </div>
  );
}
