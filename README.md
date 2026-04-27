# Biblioteca UNELLEZ

Proyecto base con Next.js (App Router) y Supabase.

## 1) Configurar variables de entorno

1. Crea tu archivo `.env.local` a partir de `.env.example`.
2. Coloca los valores de tu proyecto de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Puedes obtener ambos valores en Supabase: `Project Settings > API`.

## 2) Levantar el proyecto

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 3) Qué quedó conectado

- Cliente de navegador: `src/lib/supabase/client.ts`
- Cliente de servidor: `src/lib/supabase/server.ts`
- Proxy (Next 16) para refresco de sesión: `src/proxy.ts`
- Validación visual de conexión inicial: `src/app/page.tsx`

## Notas

- En Next.js 16, `middleware` ahora se llama `proxy`.
- El `proxy` refresca sesión con Supabase usando cookies.
