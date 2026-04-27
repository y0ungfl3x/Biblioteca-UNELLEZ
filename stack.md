# Definición del Stack Tecnológico - UNELLEZ Biblioteca

## 1. Ecosistema Principal

- **Framework:** Next.js (App Router) - Versión 14 o superior.
- **Lenguaje:** TypeScript (Estricto).
- **Renderizado:** Priorizar Server-Side Rendering (SSR) y Server Actions para mutaciones de datos. Client Components solo cuando haya interactividad (hooks).
- **Despliegue:** Vercel.

## 2. Base de Datos y Autenticación

- **Proveedor:** Supabase.
- **Base de Datos:** PostgreSQL.
- **Autenticación:** `@supabase/ssr` (Supabase Auth con manejo de sesiones vía Cookies y Middleware en Next.js).
- **Almacenamiento:** Supabase Storage (para portadas de libros).

## 3. Caché y Concurrencia

- **Proveedor:** Upstash (Serverless Redis).
- **Criterio de uso:** Redis solo para caché y coordinación efímera; PostgreSQL sigue siendo la fuente de verdad para reservas, préstamos y multas.
- **Casos de uso:**
  - Caché de resultados de búsqueda del catálogo.
  - Apoyo a colas de espera y bloqueo atómico temporal para evitar "Race Conditions" al reservar el último ejemplar de un libro.

## 4. UI / UX

- **Estilos:** Tailwind CSS.
- **Componentes:** Shadcn/ui (Radix UI).
- **Iconos:** Lucide React.
- **Animaciones:** Framer Motion (transiciones sutiles).
- **Paradigma de Diseño:** Mobile-First, responsivo, simulando una interfaz nativa de aplicación móvil (Bottom Navigation Bar en móviles).

## 5. Herramientas Adicionales

- **PWA:** `next-pwa` (o soporte nativo) para Service Workers y funcionalidad offline.
- **Escáner QR:** `html5-qrcode` para lectura de carnet y libros.
- **Generación de PDFs:** Para la exportación de los reportes del sistema.
- **Tareas Programadas (Cron):** Vercel Cron Jobs (para evaluación diaria de multas y notificaciones).
- **Auditoría:** Registro persistente en PostgreSQL de operaciones críticas y cambios de parámetros.
