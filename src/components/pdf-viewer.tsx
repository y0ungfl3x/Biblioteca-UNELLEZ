"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FileWarning, RotateCcw, ExternalLink } from "lucide-react";

const LOAD_TIMEOUT_MS = 15000;

export function PdfViewer({ src, title }: { src: string; title: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, attempt]);

  function retry() {
    setStatus("loading");
    setAttempt((a) => a + 1);
  }

  if (status === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-md w-full">
          <FileWarning className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">
            No se pudo cargar el documento
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            El visor tardó demasiado en responder. Puede ser un problema de
            conexión con el servidor del documento.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={retry}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reintentar
            </button>
            <a
              href={src.split("#")[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Abrir en otra pestaña
            </a>
          </div>
          <Link
            href="/"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-sm font-medium">Cargando documento…</span>
        </div>
      )}
      <iframe
        key={attempt}
        src={src}
        className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        title={title}
        allowFullScreen
        onLoad={() => setStatus("ready")}
      />
    </>
  );
}
