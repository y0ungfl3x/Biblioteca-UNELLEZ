# Checklist de Mejoras — Auditoría visual (Playwright)

Auditoría realizada en `localhost:3030` con sesión admin, en 1440px / 768px / 390px.
Regla del proyecto: **no cambiar comportamiento base** — solo visual, validaciones y arreglos de cosas rotas.

## 🔴 P1 — Cosas rotas (confirmadas en vivo)

- [x] **Cards del Explorer se rompen en anchos intermedios** (el reporte original). ✅ Hecho: footer apilado (`mt-auto` + disponibilidad arriba, acciones `flex-1` abajo). Verificado en 390/768/1440.
  En 768px el botón "Solicitar Préstamo" se sale del borde de la card y tapa el texto "X Disponibles"; en 1440px ya hay colisión leve.
  Causa: `src/app/dashboard/explorer/page.tsx:114-137` usa `flex justify-between` sin permitir wrap, y `loan-button.tsx` mete texto largo con `whitespace` fijo.
  Fix sugerido: footer en `flex-col gap-2` (o `flex-wrap`) con botón `w-full`, disponibilidad arriba. En móvil (390px) y columna única se ve bien — no tocar ese caso.
- [x] **Portadas rotas muestran ícono roto + texto alt** en Home y Explorer. ✅ Hecho: nuevo `src/components/book-cover.tsx` con `onError` que cae al placeholder de cada página (0 imágenes rotas verificado).
  Las imágenes de `covers.openlibrary.org` fallan (24/25 imágenes rotas en Home durante la prueba) y el placeholder "SIN PORTADA" solo aparece cuando `cover_image_path` es null — nunca en error de red.
  Fix: handler `onError` que cambie al mismo placeholder (componente cliente `BookCover` reutilizable). Aplica a `src/app/page.tsx` y `explorer/page.tsx`.
- [x] **Lector `/read/[id]` sin estado de error ni carga**: ✅ Hecho — nuevo `src/components/pdf-viewer.tsx` con spinner de carga, timeout de 15s y card de error ("Reintentar", "Abrir en otra pestaña", "Volver al catálogo"). Verificado en vivo.
- [x] **Dark mode del sistema rompe el fondo**: ✅ Hecho: media query eliminado. `src/app/globals.css:15-20` pone `--background: #0a0a0a` con `prefers-color-scheme: dark`, pero todo el UI hardcodea colores claros (`bg-white`, `text-slate-900`). Con el SO en oscuro el fondo queda negro detrás de cards claras. Fix mínimo: eliminar/neutralizar ese media query.
- [x] **La fuente Geist nunca se aplica**: ✅ Hecho: body ahora usa `var(--font-geist-sans)`. `globals.css:25` fuerza `font-family: Arial, Helvetica`. Geist está cargada vía `next/font` (se descarga y no se usa). Fix: `font-family: var(--font-geist-sans), system-ui, sans-serif`. Mejora tipográfica inmediata en toda la app.
- [x] **Filtros de fecha en Préstamos se cortan en móvil (390px)**: ✅ Hecho — `flex-wrap` en la fila de filtros. Verificado en 390px.
- [x] **`import { clsx }` al final del archivo** ✅ Hecho: movido arriba. `src/app/dashboard/explorer/page.tsx:155` — funciona por hoisting pero debe ir arriba.

## 🟠 P2 — Validaciones en tiempo real (hoy todo es tooltip nativo del navegador)

- [x] **Login** (`/login`): ✅ Hecho — validación inline al blur con mensajes bajo el campo + borde rojo, toggle 👁 mostrar contraseña, submit bloqueado si inválido. (El spinner de carga ya existía.) Verificado: flujo válido intacto.
- [x] **Crear Usuario** (`/dashboard/users`): ✅ Hecho — email/nombre/cédula con error inline al blur, hint "Mínimo 6 caracteres" en vivo (gris→rojo→verde), hint ámbar "solo números" al tipear letras en cédula/teléfono, submit bloqueado si inválido (mismas reglas que las nativas anteriores — sin cambio de comportamiento). Helper compartido en `src/lib/validation.ts`.
- [ ] **Inventario expandido**: validar `cantidad >= 1` en "Registrar Copias" y formato URL en "Enlazar E-Book" con feedback inline (no se probó en vivo para no mutar datos — revisar `inventory-manager.tsx`).
- [x] **Recuperar contraseña**: ✅ Hecho — validación inline de email al blur. (El estado de envío y mensaje de éxito ya existían.)
- [ ] **Perfil**: validación inline de teléfono en "Guardar Cambios".

## 🟡 P3 — Mejoras visuales

- [x] **Banner "Activa notificaciones push" aparece en TODAS las páginas**: ✅ Hecho — botón X que persiste en localStorage (`push-banner-dismissed`), el banner verde de "activas" ya no se muestra (éxito silencioso), y el wrapper ya no deja hueco vacío cuando no hay banner. La lógica de suscripción push quedó intacta.
- [ ] **Pie de cards en Home desalineado**: badges "X DISPONIBLES" y botones quedan a alturas distintas según el contenido (758px lo empeora: botones a 2 líneas). Anclar footer con `mt-auto` (card como flex-col) y alinear badges.
- [x] **Pluralización**: ✅ Hecho — "1 Copia" singular en inventario (tabla desktop y card móvil). Pendiente menor: "1 Disponibles" en cards del catálogo.
- [x] **Grid del Home en 768px** muestra 3 columnas muy apretadas. ✅ Hecho: ahora 2 en `sm-lg`, 3 en `lg`, 4 en `xl` — botones ya no envuelven y badges quedan alineados.
- [x] **Anchos inconsistentes en dashboard**: ✅ Hecho — banner push ahora `max-w-7xl` (alineado con las páginas de staff), Usuarios pasó de 6xl a 7xl. Las páginas de bienvenida/perfil/mis-préstamos quedan angostas a propósito (contenido liviano).
- [ ] **Selects nativos sin estilizar** (fechas `dd/mm/aaaa`, "Mostrando 5 por página") desentonan con el resto del diseño redondeado.
- [ ] **Paginación de inventario**: botones prev/next sin `aria-label` (accesibilidad).
- [x] **Select "Rol a Asignar" tiene una sola opción** — RESUELTO: es intencional (regla de negocio comentada en el código: admin crea bibliotecarios, bibliotecario crea estudiantes). No tocar.

## 🟢 P4 — Animaciones ligeras (framer-motion ya está instalado)

- [x] Fade-in + stagger sutil de cards al cargar el grid (Home/Explorer). ✅ Hecho — clase `.card-enter` (CSS keyframes, sin JS) con delay escalonado `--enter-delay` capped a 8 cards.
- [x] Transición al expandir filas de inventario — ya existía (`animate-in fade-in slide-in-from-top-1`), no se tocó.
- [x] Skeleton loaders. ✅ Hecho — `src/app/dashboard/loading.tsx` con grid de skeletons + clase `.skeleton` reutilizable.
- [ ] Transición de página sutil en el dashboard (opacity 150-200ms) — opcional, no implementada.
- [x] Respetar `prefers-reduced-motion`. ✅ Hecho — media query global en globals.css desactiva animaciones/transiciones.
- [x] Animar entrada de errores inline del login — ✅ incluido en la validación (motion.p fade/slide).

## ✅ Lo que ya está bien (no tocar)

- Móvil 390px en general: tab bar inferior, inventario como cards, sin overflow horizontal en ninguna página probada.
- Estados vacíos de Mis Préstamos y búsqueda del Explorer.
- Error de credenciales del login (banner rojo claro).
- Hover/microinteracciones existentes en cards y botones.
- Realtime "Conectado" en Préstamos.

---
*Screenshots de evidencia (antes y después) en `audit-screenshots/` — los `*-fixed*.png` son post-arreglo. Borrar la carpeta al terminar el proyecto.*
