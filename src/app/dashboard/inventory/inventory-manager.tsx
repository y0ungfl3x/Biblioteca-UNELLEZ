"use client";

import { useState, useEffect } from "react";
import { 
  Search, CopyPlus, Link as LinkIcon, ChevronDown, ChevronUp, 
  Loader2, BookCopy, FileText, Filter, ChevronLeft, ChevronRight 
} from "lucide-react";
import { addPhysicalCopies, linkEbook } from "@/app/actions/inventory";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";

export interface InventoryBook {
  id: string;
  code: string | null;
  title: string;
  category: string | null;
  physical_total: number;
  ebooks_total: number;
}

interface InventoryManagerProps {
  books: InventoryBook[];
  categories: string[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  currentFilters: {
    query: string;
    category: string;
    availability: string;
  };
}

export function InventoryManager({ 
  books, 
  categories, 
  totalCount, 
  currentPage, 
  itemsPerPage,
  currentFilters 
}: InventoryManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(currentFilters.query);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const updateFilters = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || value === "" || (key === "page" && value === 1)) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    // Reset to page 1 if filters change
    if (!updates.page) params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== currentFilters.query) {
        updateFilters({ q: localQuery });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuery]);

  return (
    <div className="space-y-6">
      {/* Filtros Avanzados */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
          <Filter className="w-4 h-4 text-orange-600" />
          <span>Filtros Avanzados</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Título o código..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-sm"
            />
          </div>

          <select
            value={currentFilters.category}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-sm"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={currentFilters.availability}
            onChange={(e) => updateFilters({ availability: e.target.value })}
            className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-sm"
          >
            <option value="all">Cualquier formato</option>
            <option value="physical">Solo con copias físicas</option>
            <option value="digital">Solo con E-Book (PDF)</option>
            <option value="none">Sin inventario</option>
          </select>
        </div>
      </div>

      {/* Lista de Resultados */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 md:min-w-full">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-4">Libro</th>
                <th className="px-6 py-4">Físicos</th>
                <th className="px-6 py-4">Digital (PDF)</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map((book) => (
                <BookRow 
                  key={book.id} 
                  book={book} 
                  isExpanded={expandedId === book.id} 
                  onToggle={() => setExpandedId(expandedId === book.id ? null : book.id)} 
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Cards) */}
        <div className="md:hidden divide-y divide-slate-100">
          {books.map((book) => (
            <MobileBookCard 
              key={book.id} 
              book={book} 
              isExpanded={expandedId === book.id} 
              onToggle={() => setExpandedId(expandedId === book.id ? null : book.id)} 
            />
          ))}
        </div>
        
        {books.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500">No se encontraron libros que coincidan con los filtros.</p>
            <button 
              onClick={() => router.push(pathname)}
              className="mt-4 text-orange-600 font-bold hover:underline"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}

        {/* Pagina de Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Mostrando <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> de <span className="text-slate-900">{totalCount}</span> libros
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateFilters({ page: currentPage - 1 })}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Simple pagination logic to show limited pages
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilters({ page: pageNum })}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum 
                            ? "bg-orange-500 text-white shadow-sm" 
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="flex items-end px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateFilters({ page: currentPage + 1 })}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookRow({ book, isExpanded, onToggle }: { book: InventoryBook, isExpanded: boolean, onToggle: () => void }) {
  const [loadingPhysical, setLoadingPhysical] = useState(false);
  const [loadingEbook, setLoadingEbook] = useState(false);

  async function handleAddPhysical(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingPhysical(true);
    const formData = new FormData(e.currentTarget);
    await addPhysicalCopies(formData);
    setLoadingPhysical(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleAddEbook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingEbook(true);
    const formData = new FormData(e.currentTarget);
    await linkEbook(formData);
    setLoadingEbook(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <>
      <tr 
        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isExpanded ? 'bg-orange-50/50' : ''}`} 
        onClick={onToggle}
      >
        <td className="px-6 py-4">
          <div className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{book.title}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">
            Código: <span className="text-slate-700">{book.code || 'N/A'}</span> • Categoría: <span className="text-slate-700">{book.category}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
            book.physical_total > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {book.physical_total} {book.physical_total === 1 ? 'Copia' : 'Copias'}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
            book.ebooks_total > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {book.ebooks_total > 0 ? 'Digital Disponible' : 'Sin E-Book'}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-orange-500 text-white rotate-180' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`}>
            <ChevronDown className="w-5 h-5" />
          </button>
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <td colSpan={4} className="p-0 border-b border-orange-100 bg-orange-50/5">
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-1 duration-200">
              
              {/* Form Copias Físicas */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
                  <BookCopy className="w-4 h-4 text-orange-600" />
                  <span>Control de Stock Físico</span>
                </h4>
                <form onSubmit={handleAddPhysical} className="space-y-4">
                  <input type="hidden" name="bookId" value={book.id} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Cantidad</label>
                      <input type="number" name="quantity" min="1" max="50" required defaultValue="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Estado inicial</label>
                      <select name="condition" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium">
                        <option value="nuevo">Nuevo</option>
                        <option value="bueno">Bueno</option>
                        <option value="regular">Regular</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={loadingPhysical} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-200/50 transition-all disabled:opacity-50 active:scale-95">
                    {loadingPhysical ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CopyPlus className="w-5 h-5" /> Registrar Copias</>}
                  </button>
                </form>
              </div>

              {/* Form E-book */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Documento Digital</span>
                </h4>
                <form onSubmit={handleAddEbook} className="space-y-4">
                  <input type="hidden" name="bookId" value={book.id} />
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">URL del Recurso (PDF/EPUB)</label>
                    <input type="url" name="url" required placeholder="https://biblioteca.unellez.edu.ve/documento.pdf" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium" />
                    <p className="text-[10px] text-slate-400 mt-2 ml-1">Vincular un archivo externo o de Supabase Storage para lectura online.</p>
                  </div>

                  <button type="submit" disabled={loadingEbook} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200/50 transition-all disabled:opacity-50 active:scale-95">
                    {loadingEbook ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LinkIcon className="w-5 h-5" /> Enlazar E-Book</>}
                  </button>
                </form>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function MobileBookCard({ book, isExpanded, onToggle }: { book: InventoryBook, isExpanded: boolean, onToggle: () => void }) {
  const [loadingPhysical, setLoadingPhysical] = useState(false);
  const [loadingEbook, setLoadingEbook] = useState(false);

  async function handleAddPhysical(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingPhysical(true);
    const formData = new FormData(e.currentTarget);
    await addPhysicalCopies(formData);
    setLoadingPhysical(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleAddEbook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingEbook(true);
    const formData = new FormData(e.currentTarget);
    await linkEbook(formData);
    setLoadingEbook(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className={clsx("flex flex-col transition-all", isExpanded ? "bg-orange-50/30" : "bg-white")}>
      <div className="p-5 flex items-start justify-between gap-4 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 space-y-1">
          <div className="font-bold text-slate-900 leading-tight">{book.title}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Cod: {book.code || 'N/A'} • {book.category}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
              book.physical_total > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {book.physical_total} {book.physical_total === 1 ? 'Copia' : 'Copias'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
              book.ebooks_total > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {book.ebooks_total > 0 ? 'Digital' : 'No Digital'}
            </span>
          </div>
        </div>
        <button className={clsx(
          "p-2 rounded-lg transition-all flex-shrink-0",
          isExpanded ? "bg-orange-500 text-white rotate-180 shadow-md" : "text-slate-400 bg-slate-50"
        )}>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-6 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-orange-100/50 pt-5">
          {/* Form Copias Físicas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              <BookCopy className="w-4 h-4 text-orange-600" />
              <span>STOCK FÍSICO</span>
            </h4>
            <form onSubmit={handleAddPhysical} className="space-y-4">
              <input type="hidden" name="bookId" value={book.id} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" name="quantity" min="1" max="50" required defaultValue="1" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium" />
                <select name="condition" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium">
                  <option value="nuevo">Nuevo</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
              <button type="submit" disabled={loadingPhysical} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-100 transition-all active:scale-95">
                {loadingPhysical ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CopyPlus className="w-4 h-4" /> REGISTRAR STOCK</>}
              </button>
            </form>
          </div>

          {/* Form E-book */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <span>E-BOOK / PDF</span>
            </h4>
            <form onSubmit={handleAddEbook} className="space-y-4">
              <input type="hidden" name="bookId" value={book.id} />
              <input type="url" name="url" required placeholder="https://archivo.pdf" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium" />
              <button type="submit" disabled={loadingEbook} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-100 transition-all active:scale-95">
                {loadingEbook ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LinkIcon className="w-4 h-4" /> VINCULAR DIGITAL</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
