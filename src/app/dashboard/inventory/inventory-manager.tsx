"use client";

import { useState } from "react";
import { Search, CopyPlus, Link as LinkIcon, ChevronDown, ChevronUp, Loader2, BookCopy, FileText } from "lucide-react";
import { addPhysicalCopies, linkEbook } from "@/app/actions/inventory";

export function InventoryManager({ books }: { books: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar libro por título o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-slate-900"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold">
            <tr>
              <th className="px-6 py-4">Libro</th>
              <th className="px-6 py-4">Físicos</th>
              <th className="px-6 py-4">Digital (PDF)</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBooks.slice(0, 100).map((book) => (
              <BookRow key={book.id} book={book} isExpanded={expandedId === book.id} onToggle={() => setExpandedId(expandedId === book.id ? null : book.id)} />
            ))}
          </tbody>
        </table>
        
        {filteredBooks.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No se encontraron libros que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}

function BookRow({ book, isExpanded, onToggle }: { book: any, isExpanded: boolean, onToggle: () => void }) {
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
      <tr className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-orange-50/30' : ''}`} onClick={onToggle}>
        <td className="px-6 py-4">
          <div className="font-semibold text-slate-900">{book.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">Código: {book.code || 'N/A'} • Categoría: {book.category}</div>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
            book.physical_total > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {book.physical_total} Copias
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
            book.ebooks_total > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {book.ebooks_total > 0 ? 'Sí (Enlazado)' : 'No'}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="p-2 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <td colSpan={4} className="p-0 border-b-2 border-orange-100 bg-orange-50/10">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Form Copias Físicas */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                  <BookCopy className="w-4 h-4 text-orange-600" />
                  <span>Añadir Copias Físicas</span>
                </h4>
                <form onSubmit={handleAddPhysical} className="space-y-4">
                  <input type="hidden" name="bookId" value={book.id} />
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad a Ingresar</label>
                    <input type="number" name="quantity" min="1" max="50" required defaultValue="1" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Condición Física</label>
                    <select name="condition" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all">
                      <option value="nuevo">Nuevo</option>
                      <option value="bueno">Bueno</option>
                      <option value="regular">Regular</option>
                    </select>
                  </div>

                  <button type="submit" disabled={loadingPhysical} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50">
                    {loadingPhysical ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CopyPlus className="w-4 h-4" /> Guardar Copias</>}
                  </button>
                </form>
              </div>

              {/* Form E-book */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center space-x-2 text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Vincular Documento Digital (PDF/EPUB)</span>
                </h4>
                <form onSubmit={handleAddEbook} className="space-y-4">
                  <input type="hidden" name="bookId" value={book.id} />
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL Pública del Archivo</label>
                    <input type="url" name="url" required placeholder="https://ejemplo.com/archivo.pdf" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all" />
                    <p className="text-[10px] text-slate-400 mt-1">El archivo debe ser accesible para lectura. En producción se conectaría con Supabase Storage.</p>
                  </div>

                  <button type="submit" disabled={loadingEbook} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50 mt-auto">
                    {loadingEbook ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LinkIcon className="w-4 h-4" /> Guardar E-Book</>}
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
