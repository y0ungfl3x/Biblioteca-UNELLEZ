# 📚 Guía de Defensa de Tesis — Sistema de Gestión Bibliotecaria UNELLEZ

> **Proyecto:** Sistema Web Progresivo para la Gestión Integral de la Biblioteca de la Universidad Nacional Experimental de los Llanos Occidentales "Ezequiel Zamora" (UNELLEZ).

---

## Tabla de Contenidos

1. [Introducción y Planteamiento del Problema](#1-introducción-y-planteamiento-del-problema)
2. [Objetivos del Sistema](#2-objetivos-del-sistema)
3. [Marco Tecnológico (Stack)](#3-marco-tecnológico-stack)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Modelo de Base de Datos](#5-modelo-de-base-de-datos)
6. [Módulos Funcionales](#6-módulos-funcionales)
7. [Reglas de Negocio](#7-reglas-de-negocio)
8. [Seguridad y Control de Acceso](#8-seguridad-y-control-de-acceso)
9. [Notificaciones Push y Cron Jobs](#9-notificaciones-push-y-cron-jobs)
10. [PWA y Funcionalidad Offline](#10-pwa-y-funcionalidad-offline)
11. [Estructura de Archivos del Proyecto](#11-estructura-de-archivos-del-proyecto)
12. [Flujo de Datos y Renderizado](#12-flujo-de-datos-y-renderizado)
13. [Despliegue y Configuración](#13-despliegue-y-configuración)
14. [Glosario Técnico](#14-glosario-técnico)
15. [Preguntas Frecuentes de Jurado](#15-preguntas-frecuentes-de-jurado)

---

## 1. Introducción y Planteamiento del Problema

La biblioteca de la UNELLEZ, como muchas bibliotecas universitarias venezolanas, enfrenta los siguientes problemas operativos:

- **Gestión manual de préstamos:** El control de préstamos y devoluciones se realiza mediante registros en papel o planillas, lo que genera errores humanos, pérdida de datos y lentitud.
- **Ausencia de catálogo digital:** Los estudiantes no pueden consultar la disponibilidad de un libro sin asistir físicamente a la biblioteca.
- **Falta de control de inventario en tiempo real:** El personal no tiene una visión clara de cuántas copias de un libro están disponibles, prestadas o en reparación.
- **Imposibilidad de sancionar incumplimientos automáticamente:** Las multas y bloqueos de cuenta por retraso en devoluciones dependen de la memoria del bibliotecario.
- **Sin canal de notificación:** Los estudiantes no reciben recordatorios de vencimiento ni alertas sobre disponibilidad de libros.

### Solución Propuesta

Se diseñó e implementó un **Sistema Web Progresivo (PWA)** que digitaliza completamente las operaciones de la biblioteca, desde la consulta del catálogo hasta el control de préstamos, sanciones automáticas y notificaciones push. El sistema es accesible desde cualquier dispositivo con navegador web y puede instalarse en la pantalla de inicio del teléfono como si fuera una aplicación nativa.

---

## 2. Objetivos del Sistema

### Objetivo General

Desarrollar un sistema web progresivo para la gestión integral de la biblioteca de la UNELLEZ que permita automatizar los procesos de catalogación, préstamo, devolución, sanciones y notificaciones.

### Objetivos Específicos

1. Implementar un catálogo digital con búsqueda por título, autor y categoría, accesible para cualquier usuario (incluyendo visitantes no autenticados).
2. Desarrollar un módulo de préstamos con control de estados (solicitado → aprobado → entregado → devuelto) y gestión de inventario por copia física.
3. Aplicar reglas de negocio automatizadas: límites de préstamos simultáneos, sanciones por retraso y bloqueo/desbloqueo automático de cuentas.
4. Implementar un sistema de roles (Invitado, Estudiante, Bibliotecario, Administrador) con políticas de seguridad a nivel de fila (RLS) en la base de datos.
5. Desarrollar notificaciones push para recordar vencimientos de préstamos.
6. Desplegar la aplicación como PWA instalable con soporte offline para consulta del catálogo.

---

## 3. Marco Tecnológico (Stack)

### 3.1 Diagrama General del Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Navegador)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  React 19     │  │  Tailwind CSS│  │  Framer Motion    │ │
│  │  (Componentes)│  │  (Estilos)   │  │  (Animaciones)    │ │
│  └──────┬───────┘  └──────────────┘  └───────────────────┘ │
│         │                                                   │
│  ┌──────┴──────────────────────────────────────────────┐    │
│  │           Service Worker (PWA / Offline)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┴───────────────────────────────────┐
│                  SERVIDOR (Next.js 16 en Vercel)            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ App Router    │  │Server Actions│  │  API Routes       │ │
│  │ (SSR/RSC)     │  │(Mutaciones)  │  │  (Cron, Push)     │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Proxy (ex-Middleware) — Sesiones        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ API REST + Realtime
┌─────────────────────────┴───────────────────────────────────┐
│                     SUPABASE (BaaS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  PostgreSQL   │  │   Auth       │  │  Storage          │ │
│  │  (Base Datos) │  │  (JWT+Cookies)│ │  (Portadas, PDFs) │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  RLS          │  │  Triggers +  │                         │
│  │  (Seguridad)  │  │  Funciones   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tecnologías Principales

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| **Framework Web** | Next.js (App Router) | 16.2.4 | Framework React con renderizado del lado del servidor (SSR), Server Components y Server Actions integrados. Permite una arquitectura fullstack en un solo proyecto. |
| **Lenguaje** | TypeScript | 5.x | Tipado estático que previene errores en tiempo de compilación. Mejora la mantenibilidad del código. |
| **Librería UI** | React | 19.2.4 | Biblioteca declarativa para construir interfaces de usuario basadas en componentes. |
| **Estilos** | Tailwind CSS | 4.x | Framework CSS utility-first que permite prototipado rápido y diseño responsivo sin escribir hojas de estilo separadas. |
| **Animaciones** | Framer Motion | 12.x | Animaciones declarativas de alto rendimiento para React que mejoran la experiencia de usuario. |
| **Iconos** | Lucide React | 1.x | Set de iconos SVG optimizados para React, consistentes y accesibles. |
| **Base de Datos** | PostgreSQL (Supabase) | 15+ | Base de datos relacional robusta con soporte para transacciones ACID, Row Level Security y funciones almacenadas. |
| **Autenticación** | Supabase Auth | — | Autenticación basada en JWT con manejo de sesiones vía cookies HTTP seguras. |
| **Backend como Servicio** | Supabase | — | Provee base de datos, autenticación, almacenamiento de archivos y API REST auto-generada sin necesidad de un backend separado. |
| **Notificaciones** | Web Push (VAPID) | — | Protocolo estándar W3C para notificaciones push en navegadores. No depende de terceros como Firebase. |
| **Despliegue** | Vercel | — | Plataforma de despliegue optimizada para Next.js con CDN global, CI/CD automático y Cron Jobs. |
| **PWA** | Service Workers nativos | — | Permite instalación en pantalla de inicio y caché offline para consulta del catálogo sin conexión. |

### 3.3 ¿Por qué esta combinación y no otra?

| Alternativa considerada | Razón del descarte |
|------------------------|--------------------|
| PHP + MySQL (stack tradicional LAMP) | No ofrece SSR moderno, carece de tipado estático, y la experiencia de usuario (UX) es significativamente inferior a un SPA/PWA. |
| Django + PostgreSQL | Buen framework pero su ecosistema frontend requiere herramientas adicionales (Vue/React aparte), resultando en una arquitectura más compleja de mantener. |
| Firebase (Google) | Lock-in del proveedor. No ofrece base de datos relacional (usa NoSQL), lo que dificulta consultas complejas como el flujo de préstamos con múltiples relaciones. |
| Express.js + MongoDB | MongoDB (NoSQL) no es ideal para un dominio altamente relacional como una biblioteca, donde las relaciones entre libros, copias, préstamos y usuarios son fundamentales. |

**La combinación Next.js + Supabase permite:**
- Un proyecto **fullstack en un solo repositorio** (monorepo).
- **Seguridad a nivel de base de datos** con Row Level Security (RLS), no solo en el backend.
- **API REST auto-generada** por Supabase, reduciendo la escritura de endpoints manuales.
- **Despliegue gratuito** en Vercel con HTTPS, CDN global y dominios personalizados.

---

## 4. Arquitectura del Sistema

### 4.1 Patrón Arquitectónico

El sistema sigue una **Arquitectura Orientada a Componentes (Component-Based Architecture)** combinada con el patrón **Server-First** de Next.js:

1. **Server Components (RSC):** Los componentes que solo muestran datos se renderizan completamente en el servidor. Esto reduce el JavaScript enviado al navegador y mejora el rendimiento.
2. **Client Components:** Solo los componentes que requieren interactividad (formularios, modales, botones de acción) se ejecutan en el navegador.
3. **Server Actions:** Las operaciones de escritura (crear préstamo, aprobar solicitud, devolver libro) se ejecutan como funciones del servidor invocadas directamente desde formularios o botones, eliminando la necesidad de crear APIs REST manualmente.

### 4.2 Flujo de una Solicitud HTTP

```
Usuario → Navegador → Vercel Edge → Next.js Proxy (refresco de sesión)
                                           │
                                    ┌──────┴──────┐
                                    │ Server      │
                                    │ Component   │
                                    │ (consulta   │
                                    │  Supabase)  │
                                    └──────┬──────┘
                                           │
                                    HTML renderizado
                                           │
                                    ← Respuesta al navegador
```

### 4.3 Proxy (Middleware) de Sesiones

En Next.js 16, el archivo `proxy.ts` (antes llamado `middleware.ts`) se ejecuta en **cada solicitud** y cumple una función crítica:

- **Refresca la sesión de Supabase** leyendo y actualizando las cookies de autenticación.
- **Garantiza que el token JWT no expire** mientras el usuario navega por la aplicación.
- Actúa como una **capa de seguridad perimetral** antes de que cualquier página se renderice.

```
Toda solicitud HTTP → proxy.ts → Refresca cookies → Continúa al App Router
```

---

## 5. Modelo de Base de Datos

### 5.1 Diagrama Entidad-Relación

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  auth.users  │────▶│  profiles    │────▶│  loans           │
│  (Supabase)  │     │  (rol,      │     │  (user_id,       │
│              │     │   estado,   │     │   copy_id,       │
│              │     │   cedula)   │     │   status,        │
│              │     │             │     │   due_at, ...)   │
└─────────────┘     └─────────────┘     └────────┬─────────┘
                                                  │
                    ┌─────────────┐     ┌─────────┴────────┐
                    │  books      │────▶│ physical_copies   │
                    │  (titulo,   │     │  (inventory_code, │
                    │   isbn,     │     │   status,         │
                    │   ...)      │     │   location)       │
                    └──────┬──────┘     └──────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────┴───┐ ┌──────┴─────┐ ┌───┴──────────┐
     │book_authors│ │ categories │ │   ebooks      │
     │(M:N)       │ │            │ │(storage_path, │
     └────────────┘ └────────────┘ │ access_level) │
                                   └───────────────┘
```

### 5.2 Tablas Principales

| Tabla | Propósito | Campos Clave |
|-------|----------|--------------|
| `profiles` | Perfil del usuario con rol y estado de cuenta | `id`, `cedula`, `full_name`, `role`, `status`, `suspended_until` |
| `books` | Registro bibliográfico maestro de cada obra | `id`, `title`, `isbn`, `category_id`, `material_type`, `is_reference` |
| `authors` | Autores registrados en el sistema | `id`, `full_name` |
| `book_authors` | Relación muchos-a-muchos entre libros y autores | `book_id`, `author_id` |
| `categories` | Categorías temáticas del catálogo | `id`, `name` |
| `physical_copies` | Cada ejemplar físico prestable | `id`, `book_id`, `inventory_code`, `status`, `location` |
| `ebooks` | Recursos digitales asociados a un libro | `id`, `book_id`, `storage_path`, `access_level`, `format` |
| `loans` | Registro completo de cada préstamo | `id`, `user_id`, `copy_id`, `status`, `due_at`, `returned_at` |
| `reservations` | Cola de reservas para libros sin copias disponibles | `id`, `user_id`, `book_id`, `status`, `queue_position` |
| `fines` | Multas generadas por incumplimiento | `id`, `loan_id`, `user_id`, `amount`, `status` |
| `loan_parameters` | Configuración global del sistema (fila única) | `max_active_loans`, `loan_days`, `daily_fine`, `fine_block_threshold` |
| `audit_log` | Bitácora de auditoría de operaciones críticas | `actor_user_id`, `action`, `entity`, `before_data`, `after_data` |
| `notifications` | Notificaciones in-app para el usuario | `id`, `user_id`, `event_type`, `title`, `body` |
| `push_subscriptions` | Suscripciones de notificaciones push por dispositivo | `user_id`, `endpoint`, `subscription` |
| `ebook_reads` | Trazabilidad de lectura de documentos digitales | `ebook_id`, `user_id`, `started_at`, `ended_at` |

### 5.3 Vista Materializada: `catalog_view`

Para optimizar las consultas del catálogo público, se creó una **vista SQL** que combina datos de múltiples tablas en una sola consulta eficiente:

```sql
CREATE VIEW catalog_view AS
SELECT
  b.id, b.title, b.is_reference, b.material_type,
  c.name AS category,
  string_agg(DISTINCT a.full_name, ', ') AS authors,
  count(pc.id) FILTER (WHERE pc.status = 'disponible') AS physical_available,
  count(pc.id) AS physical_total,
  count(e.id) FILTER (WHERE e.is_active) AS ebooks_total
FROM books b
LEFT JOIN categories c ON c.id = b.category_id
LEFT JOIN book_authors ba ON ba.book_id = b.id
LEFT JOIN authors a ON a.id = ba.author_id
LEFT JOIN physical_copies pc ON pc.book_id = b.id
LEFT JOIN ebooks e ON e.book_id = b.id
GROUP BY b.id, c.name;
```

**¿Por qué una vista?** Permite que la página principal del catálogo haga una sola consulta (`SELECT * FROM catalog_view`) en lugar de cinco JOINs separados, mejorando el rendimiento y simplificando el código.

### 5.4 Tipos Enumerados (ENUMs)

Se definieron tipos PostgreSQL enumerados para garantizar la integridad de datos:

| Enum | Valores |
|------|---------|
| `app_role` | `invitado`, `estudiante`, `bibliotecario`, `administrador` |
| `account_status` | `activo`, `bloqueado` |
| `copy_status` | `disponible`, `prestado`, `reparacion`, `reservado`, `perdido`, `baja` |
| `loan_status` | `solicitado`, `aprobado`, `entregado`, `vencido`, `devuelto`, `multado`, `bloqueado`, `rechazado`, `cancelado` |
| `loan_mode` | `interna`, `externa` |
| `reservation_status` | `activa`, `cumplida`, `cancelada`, `expirada` |
| `ebook_access_level` | `publico`, `comunidad`, `restringido` |

**Ventaja de ENUMs sobre strings:** PostgreSQL rechaza cualquier valor que no esté en la lista, previniendo errores de datos como escribir "disponble" en lugar de "disponible".

---

## 6. Módulos Funcionales

### 6.1 Módulo de Autenticación

**Archivos involucrados:**
- `src/app/login/page.tsx` — Formulario de inicio de sesión.
- `src/app/actions/auth.ts` — Server Actions de login, logout, creación de usuarios y recuperación de contraseña.
- `src/proxy.ts` — Refresco automático de sesión en cada solicitud.
- `src/lib/supabase/server.ts` — Cliente Supabase para el servidor.
- `src/lib/supabase/client.ts` — Cliente Supabase para el navegador.

**Flujo de autenticación:**

```
1. Usuario ingresa email + contraseña
2. Server Action `login()` → supabase.auth.signInWithPassword()
3. Supabase valida credenciales → Genera JWT
4. JWT se almacena en cookies HTTP-only (seguras, no accesibles por JavaScript)
5. proxy.ts refresca el JWT en cada navegación
6. Al crear el usuario en auth.users, un TRIGGER automático inserta un registro
   en public.profiles con el rol y la cédula extraídos de user_metadata
```

**Creación de usuarios por rol:**

| Actor | Puede crear |
|-------|------------|
| Administrador | Bibliotecarios |
| Bibliotecario | Estudiantes |
| Estudiante | Nadie (no tiene acceso) |

### 6.2 Módulo de Catálogo

**Página principal:** `src/app/page.tsx` (ruta `/`)

**Funcionalidades:**
- Búsqueda por título con filtro `ILIKE` (búsqueda insensible a mayúsculas/minúsculas).
- Filtrado por categorías mediante chips interactivos.
- Visualización de disponibilidad en tiempo real (cantidad de copias disponibles).
- Badges que indican: "Disponible", "Referencia" (solo consulta en sala), o "Solo Lectura".
- Botones de acción: Solicitar Préstamo, Leer Online (ebooks) y Descargar PDF.
- Accesible para **todos los roles**, incluyendo visitantes no autenticados.

### 6.3 Módulo de Préstamos

Este es el **módulo más complejo** del sistema y constituye el núcleo funcional.

#### Flujo Completo de un Préstamo

```
     ESTUDIANTE                     SISTEMA                    BIBLIOTECARIO
         │                             │                             │
    ┌────┴────┐                        │                             │
    │Solicitar│──────────────────▶ rpc_request_loan()                │
    │Préstamo │                   (Procedimiento Atómico)            │
    └─────────┘                        │                             │
                                 Validaciones:                       │
                                 ├─ ¿Cuenta bloqueada?               │
                                 ├─ ¿Límite de préstamos?            │
                                 ├─ ¿Libro de referencia?            │
                                 ├─ ¿Copia disponible?               │
                                 └─ SELECT ... FOR UPDATE            │
                                    SKIP LOCKED                      │
                                       │                             │
                                 Estado: SOLICITADO                  │
                                 Copia: → RESERVADO                  │
                                       │                             │
                                       │◀────────────────── ┌────────┴────────┐
                                       │                    │Aprobar Solicitud│
                                       │                    └─────────────────┘
                                 Estado: APROBADO                    │
                                       │                             │
                                       │◀────────────────── ┌────────┴────────┐
                                       │                    │Registrar Entrega│
                                       │                    └─────────────────┘
                                 Estado: ENTREGADO                   │
                                 due_at = now() + 3 días             │
                                 Copia: → PRESTADO                   │
                                       │                             │
                              ┌────────┴────────┐                    │
                              │ ¿Devuelto       │                    │
                              │  a tiempo?      │                    │
                              └───┬─────────┬───┘                    │
                                  │         │                        │
                              SÍ  │         │ NO                     │
                                  ▼         ▼                        │
                             DEVUELTO    VENCIDO                     │
                             Copia:→     Perfil: BLOQUEADO           │
                             DISPONIBLE  suspended_until:            │
                                         now() + 1 mes              │
                                         audit_log: registrado       │
```

#### Procedimiento Atómico `rpc_request_loan`

**Problema resuelto:** Si dos estudiantes solicitan la última copia de un libro al mismo tiempo, ambas solicitudes podrían asignar la misma copia (condición de carrera o *Race Condition*).

**Solución:** Se implementó un **procedimiento almacenado PostgreSQL** que usa `SELECT ... FOR UPDATE SKIP LOCKED` para:

1. **Bloquear** la fila de la copia seleccionada a nivel de transacción.
2. Si otro usuario intenta la misma copia, la instrucción `SKIP LOCKED` **salta** esa fila y busca la siguiente copia disponible.
3. Toda la operación es **atómica** (todo o nada): si alguna validación falla, no se crea el préstamo ni se reserva la copia.

```sql
SELECT id INTO v_copy_id
FROM physical_copies
WHERE book_id = p_book_id AND status = 'disponible'
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

**¿Qué significa cada parte?**
- `FOR UPDATE` → Bloquea la fila para que nadie más la modifique hasta que termine la transacción.
- `SKIP LOCKED` → Si la fila ya está bloqueada por otra transacción, no espera; busca la siguiente fila disponible.
- `LIMIT 1` → Solo toma una copia (la más antigua, para rotación equitativa del inventario).

#### Archivos del Módulo

| Archivo | Propósito |
|---------|----------|
| `src/app/actions/loans.ts` | Server Actions: `requestLoan()`, `updateLoanStatus()`, `renewLoan()` |
| `src/app/dashboard/loans/page.tsx` | Página del panel del Bibliotecario |
| `src/app/dashboard/loans/loans-list.tsx` | Componente interactivo con filtros y acciones |
| `src/app/dashboard/my-loans/page.tsx` | Página del panel del Estudiante |
| `src/app/dashboard/my-loans/my-loans-client.tsx` | Lista de préstamos del estudiante con renovación |
| `src/components/loan-button.tsx` | Botón "Solicitar Préstamo" en el catálogo |
| `src/components/renew-button.tsx` | Botón de renovación en el panel del estudiante |
| `src/components/loan-receipt.tsx` | Comprobante visual del préstamo |
| `src/components/confirm-modal.tsx` | Modal de confirmación para acciones críticas |

### 6.4 Módulo de Inventario

**Ruta:** `/dashboard/inventory`

**Funcionalidades:**
- Listado de todos los libros del catálogo con su inventario actual.
- **Añadir copias físicas:** El bibliotecario indica la cantidad y el sistema genera automáticamente códigos de inventario únicos (`PHY-XXXX-000000`).
- **Vincular E-Books:** Se asocia una URL de un PDF almacenado en Supabase Storage a un registro bibliográfico.
- Visualización de estado de cada copia: disponible, prestado, reservado, en reparación, etc.

### 6.5 Módulo de Gestión de Usuarios

**Ruta:** `/dashboard/users`

**Funcionalidades:**
- Listado de usuarios registrados con su rol, cédula, estado y fecha de registro.
- **Formulario de creación de usuarios** con validación por rol (un administrador solo crea bibliotecarios; un bibliotecario solo crea estudiantes).
- El usuario se crea en `auth.users` de Supabase y un **trigger automático** (`on_auth_user_created`) inserta el perfil correspondiente en `public.profiles`.

### 6.6 Módulo de Lectura Digital

**Ruta:** `/read/[bookId]`

- Los libros con recursos digitales asociados (tabla `ebooks`) pueden leerse en línea o descargarse.
- El acceso está controlado por nivel: `publico` (todos), `comunidad` (solo autenticados UNELLEZ), `restringido` (solo personal autorizado).
- Cada lectura queda registrada en `ebook_reads` para trazabilidad.

---

## 7. Reglas de Negocio

### 7.1 Reglas Implementadas en la Base de Datos

| Código | Regla | Implementación |
|--------|-------|----------------|
| **RN01** | Los libros de referencia no admiten préstamo externo | Trigger `assert_loan_rules` valida `is_reference = true` + `mode = 'externa'` → rechaza |
| **RN02** | Máximo de préstamos activos simultáneos (configurable) | Función `active_loan_limit_reached()` cuenta préstamos con estado `solicitado`, `aprobado`, `entregado`, `vencido` o `multado` |
| **RN03** | Duración del préstamo configurable (por defecto 3 días) | Campo `loan_days` en tabla `loan_parameters`. Se aplica al cambiar estado a `entregado` |
| **RN04** | Devolución tardía → Suspensión de 1 mes | Server Action `updateLoanStatus()` calcula `returned_at > due_at` → cambia perfil a `bloqueado` + `suspended_until = now() + 1 mes` |
| **RN05** | Auto-desbloqueo al expirar la sanción | Trigger `assert_loan_rules` verifica `now() >= suspended_until` → reactiva la cuenta automáticamente sin intervención manual |
| **RN06** | Prevención de duplicados de solicitud | Función `rpc_request_loan` verifica si ya existe un préstamo activo del mismo libro para el mismo usuario |
| **RN07** | Control de concurrencia para la última copia | `SELECT ... FOR UPDATE SKIP LOCKED` en `rpc_request_loan` |
| **RN08** | Renovación solo si no hay reservas en cola | Server Action `renewLoan()` consulta `reservations` con `status = 'activa'` para el mismo libro |

### 7.2 Tabla de Parámetros Configurables

La tabla `loan_parameters` almacena una **única fila** (restricción `CHECK (id = 1)`) con la configuración global:

| Parámetro | Valor por defecto | Descripción |
|-----------|-------------------|-------------|
| `max_active_loans` | 3 | Máximo de libros que un estudiante puede tener simultáneamente |
| `loan_days` | 3 | Días de duración de un préstamo desde la entrega |
| `daily_fine` | Bs. 1.00 | Multa diaria por retraso (para cálculos futuros) |
| `fine_block_threshold` | Bs. 10.00 | Monto acumulado de multas a partir del cual se bloquea la cuenta |

### 7.3 Triggers Automáticos

| Trigger | Tabla | Evento | Efecto |
|---------|-------|--------|--------|
| `trg_assert_loan_rules` | `loans` | `BEFORE INSERT OR UPDATE` | Valida todas las reglas de negocio antes de permitir la operación |
| `trg_sync_copy_status_from_loan` | `loans` | `AFTER INSERT OR UPDATE` | Sincroniza el estado de `physical_copies` según el estado del préstamo |
| `on_auth_user_created` | `auth.users` | `AFTER INSERT` | Crea automáticamente el perfil en `public.profiles` |
| `trg_*_updated_at` | Todas las tablas | `BEFORE UPDATE` | Actualiza automáticamente el campo `updated_at` |

---

## 8. Seguridad y Control de Acceso

### 8.1 Row Level Security (RLS)

RLS es una funcionalidad de PostgreSQL que permite definir **políticas de acceso a nivel de fila**. Esto significa que incluso si un usuario tiene acceso a una tabla, solo puede ver/modificar las filas que las políticas le permiten.

**¿Por qué RLS y no solo validación en el código?**
- La validación en el código del servidor puede ser bypaseada si alguien accede directamente a la API de Supabase.
- RLS se aplica **en la base de datos misma**, haciendo imposible acceder a datos no autorizados, sin importar cómo se realice la consulta.

### 8.2 Políticas por Tabla

| Tabla | Lectura (SELECT) | Escritura (INSERT/UPDATE) |
|-------|-------------------|---------------------------|
| `profiles` | Solo tu perfil propio ó staff/admin | Solo tu perfil propio ó staff/admin |
| `books`, `categories`, `authors` | Todos (público) | Solo staff/admin |
| `physical_copies` | Todos (público) | Solo staff/admin |
| `ebooks` | Público si `access_level = 'publico'`; autenticados si `comunidad`; staff si `restringido` | Solo staff/admin |
| `loans` | Solo tus préstamos propios ó staff/admin | Estudiantes: solo INSERT con `status = 'solicitado'`; Staff: UPDATE |
| `fines` | Solo tus multas propias ó staff/admin | Solo staff/admin |
| `loan_parameters` | Todos (público) | Solo administrador |
| `audit_log` | Solo staff/admin | Staff/admin ó `service_role` (cron jobs) |

### 8.3 Funciones Auxiliares de Seguridad

```sql
-- Obtiene el rol del usuario actual desde la sesión JWT
public.current_role() → app_role

-- Retorna TRUE si el usuario actual es bibliotecario o administrador
public.is_staff_or_admin() → boolean
```

Estas funciones se utilizan en las políticas RLS para evitar repetir lógica compleja.

### 8.4 Autenticación y Sesiones

- **JWT (JSON Web Tokens):** Supabase genera un token firmado al autenticarse.
- **Cookies HTTP-only:** El token se almacena en cookies que **no son accesibles por JavaScript** del navegador, previniendo ataques XSS (Cross-Site Scripting).
- **Refresco automático:** El `proxy.ts` ejecuta `supabase.auth.getUser()` en cada solicitud, lo que refresca el token antes de que expire.
- **Contraseñas:** Se almacenan cifradas con bcrypt por Supabase Auth (nunca en texto plano).

---

## 9. Notificaciones Push y Cron Jobs

### 9.1 Notificaciones Push (Web Push API)

**¿Qué son?** Mensajes que el sistema puede enviar al navegador del usuario incluso cuando la aplicación no está abierta, utilizando el protocolo estándar VAPID (Voluntary Application Server Identification).

**Flujo:**

```
1. Al ingresar al dashboard, el componente PushNotifications solicita permiso al navegador
2. Si el usuario acepta, el navegador genera una suscripción push (endpoint + claves)
3. La suscripción se guarda en push_subscriptions (tabla PostgreSQL)
4. Cuando ocurre un evento (ej: préstamo aprobado), el servidor:
   a. Busca las suscripciones del usuario en la BD
   b. Envía el mensaje usando web-push con las claves VAPID
   c. El Service Worker del navegador recibe y muestra la notificación
```

**Archivos involucrados:**
- `src/components/push-notifications.tsx` — Componente que solicita permiso y registra la suscripción.
- `src/lib/push.ts` — Función `sendPushToUser()` que envía notificaciones push desde el servidor.
- `src/app/api/push/` — API Routes para operaciones push.
- `public/sw.js` — Service Worker que recibe y muestra notificaciones.

### 9.2 Cron Job: Recordatorios de Vencimiento

**Configuración en `vercel.json`:**

```json
{
  "crons": [{
    "path": "/api/push/due-reminders",
    "schedule": "0 12 * * *"
  }]
}
```

- **`0 12 * * *`**: Se ejecuta todos los días a las 12:00 PM (mediodía UTC).
- **Función:** Busca préstamos con `status = 'entregado'` cuya fecha de vencimiento (`due_at`) sea dentro de las próximas 24 horas, y envía un recordatorio push al estudiante.

---

## 10. PWA y Funcionalidad Offline

### 10.1 ¿Qué es una PWA?

Una **Progressive Web App** es una aplicación web que puede:
- **Instalarse** en la pantalla de inicio del teléfono como una app nativa.
- **Funcionar sin conexión** (al menos parcialmente) gracias al Service Worker.
- **Recibir notificaciones push** incluso cuando el navegador está cerrado.

### 10.2 Manifest

El archivo `public/manifest.json` define los metadatos de instalación:

```json
{
  "name": "Biblioteca UNELLEZ",
  "short_name": "BiblioUNELLEZ",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#ea580c",
  "background_color": "#f8fafc"
}
```

### 10.3 Service Worker

El archivo `public/sw.js` implementa:
- **Caché del catálogo:** Las búsquedas realizadas se almacenan localmente. Si el usuario pierde conexión, puede seguir consultando los resultados previamente cacheados.
- **Recepción de notificaciones push:** El Service Worker escucha el evento `push` y muestra la notificación nativa del sistema operativo.
- **Nota importante:** La disponibilidad mostrada en modo offline es *estimada* y no se garantiza hasta que se restablezca la conexión.

---

## 11. Estructura de Archivos del Proyecto

```
Biblioteca-UNELLEZ/
├── public/                          # Archivos estáticos accesibles directamente
│   ├── logo.png                     # Logo UNELLEZ
│   ├── manifest.json                # Configuración PWA
│   └── sw.js                        # Service Worker
│
├── src/
│   ├── proxy.ts                     # Middleware/Proxy de Next.js 16 (sesiones)
│   │
│   ├── lib/                         # Código reutilizable
│   │   ├── supabase/
│   │   │   ├── client.ts            # Cliente Supabase para el navegador
│   │   │   ├── server.ts            # Cliente Supabase para el servidor (cookies)
│   │   │   └── admin.ts             # Cliente Supabase con permisos elevados
│   │   └── push.ts                  # Lógica de notificaciones push (VAPID)
│   │
│   ├── components/                  # Componentes reutilizables React
│   │   ├── loan-button.tsx          # Botón "Solicitar Préstamo"
│   │   ├── renew-button.tsx         # Botón de renovación
│   │   ├── loan-receipt.tsx         # Comprobante visual del préstamo
│   │   ├── confirm-modal.tsx        # Modal de confirmación
│   │   ├── sidebar-nav.tsx          # Navegación lateral (desktop)
│   │   ├── mobile-nav.tsx           # Navegación inferior (móvil)
│   │   └── push-notifications.tsx   # Registro de notificaciones push
│   │
│   └── app/                         # Rutas de la aplicación (App Router)
│       ├── layout.tsx               # Layout raíz (fuentes, metadata, Toaster)
│       ├── globals.css              # Estilos globales (Tailwind)
│       ├── page.tsx                 # / → Catálogo público
│       │
│       ├── login/
│       │   └── page.tsx             # /login → Formulario de acceso
│       │
│       ├── auth/
│       │   └── callback/            # /auth/callback → Callback OAuth/reset
│       │
│       ├── reset-password/          # /reset-password → Formulario nueva contraseña
│       │
│       ├── read/                    # /read/[bookId] → Lector de ebooks
│       │
│       ├── actions/                 # Server Actions (lógica del servidor)
│       │   ├── auth.ts              # Login, Logout, Crear usuario, Reset password
│       │   ├── loans.ts             # Solicitar, Actualizar estado, Renovar préstamo
│       │   ├── inventory.ts         # Añadir copias, Vincular ebooks
│       │   └── profile.ts           # Actualizar perfil
│       │
│       ├── api/                     # API Routes
│       │   ├── push/                # Endpoints para notificaciones push
│       │   └── debug/               # Endpoints de depuración (solo desarrollo)
│       │
│       └── dashboard/               # Panel autenticado
│           ├── layout.tsx           # Layout con sidebar + mobile nav
│           ├── page.tsx             # / → Página principal del dashboard
│           ├── explorer/            # /dashboard/explorer → Catálogo interno
│           ├── my-loans/            # /dashboard/my-loans → Préstamos del estudiante
│           ├── loans/               # /dashboard/loans → Panel del bibliotecario
│           ├── inventory/           # /dashboard/inventory → Gestión de inventario
│           ├── users/               # /dashboard/users → Gestión de usuarios
│           └── profile/             # /dashboard/profile → Perfil del usuario
│
├── supabase/
│   └── migrations/                  # Migraciones SQL ejecutadas secuencialmente
│       ├── 0001_initial_schema.sql       # Esquema completo: tablas, ENUMs, triggers, RLS
│       ├── 0002_fix_catalog_view.sql     # Corrección de la vista de catálogo
│       ├── 0003_optimize_rls.sql         # Optimización de rendimiento de RLS
│       ├── 0004_atomic_loan_procedure.sql # RPC atómico para préstamos
│       ├── 0005_add_profile_email.sql    # Campo email en perfiles
│       ├── 0006_push_notifications.sql   # Tabla push_subscriptions
│       └── 0007_fix_loan_return.sql      # Corrección del ciclo de sanción/devolución
│
├── scripts/                         # Scripts de utilidad y mantenimiento
│   ├── import-catalog-openlibrary.mjs  # Importador de catálogo desde OpenLibrary
│   ├── setup-admin.mjs              # Script para crear el primer administrador
│   ├── setup-storage.mjs            # Configuración de buckets de almacenamiento
│   ├── mock-inventory.mjs           # Generador de datos de prueba
│   └── ...                          # Otros scripts de diagnóstico
│
├── docs/                            # Documentación técnica interna
│   ├── prestamos.md                 # Documentación del módulo de préstamos
│   ├── catalogo-carga-inicial.md    # Estrategia de carga del catálogo
│   └── importador-openlibrary.md    # Guía del importador externo
│
├── package.json                     # Dependencias y scripts NPM
├── vercel.json                      # Configuración de Vercel (Cron Jobs)
├── next.config.ts                   # Configuración de Next.js
└── tsconfig.json                    # Configuración de TypeScript
```

---

## 12. Flujo de Datos y Renderizado

### 12.1 Server-Side Rendering (SSR) vs Client-Side

| Tipo de Componente | ¿Dónde se ejecuta? | ¿Cuándo se usa? | Ejemplo en el proyecto |
|--------------------|---------------------|------------------|------------------------|
| **Server Component** | Servidor (Node.js) | Mostrar datos de la BD, páginas sin interactividad | `page.tsx` del catálogo, dashboard |
| **Client Component** (`'use client'`) | Navegador | Formularios, botones con estado, modales, animaciones | `login/page.tsx`, `loan-button.tsx` |
| **Server Action** (`'use server'`) | Servidor, invocado desde el cliente | Mutaciones: crear, actualizar, eliminar datos | `requestLoan()`, `updateLoanStatus()` |

### 12.2 Ejemplo: Flujo de "Solicitar Préstamo"

```
1. [Browser] Usuario hace clic en "Solicitar Préstamo" (LoanButton, Client Component)
2. [Browser] Se abre ConfirmModal → Usuario confirma
3. [Browser] Se invoca Server Action requestLoan(bookId)
4. [Server]  requestLoan() llama supabase.rpc('rpc_request_loan', { p_book_id })
5. [Database] PostgreSQL ejecuta la función atómica:
             a. Verifica auth.uid() (usuario actual)
             b. Busca copia disponible con FOR UPDATE SKIP LOCKED
             c. Ejecuta INSERT en loans → Dispara trigger assert_loan_rules
             d. Trigger sync_copy_status marca la copia como 'reservado'
6. [Server]  revalidatePath() invalida el cache de las páginas afectadas
7. [Browser] Se muestra toast de éxito: "¡Solicitud de préstamo enviada!"
8. [Server]  El catálogo muestra 1 copia menos como disponible
```

---

## 13. Despliegue y Configuración

### 13.1 Variables de Entorno Requeridas

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon key) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave con permisos elevados (nunca exponer al cliente) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública VAPID para push | Generada con `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (nunca exponer) | Generada junto con la pública |
| `VAPID_SUBJECT` | Email de contacto del administrador | Ej: `mailto:admin@unellez.edu.ve` |
| `CRON_SECRET` | Secreto para autenticar los Cron Jobs | Valor aleatorio seguro |

### 13.2 Pasos para Desplegar

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd Biblioteca-UNELLEZ

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con los valores de Supabase

# 4. Ejecutar migraciones en Supabase
# (Las migraciones SQL se ejecutan manualmente en el SQL Editor de Supabase Dashboard)

# 5. Crear el primer administrador
node scripts/setup-admin.mjs

# 6. Ejecutar en modo desarrollo
npm run dev

# 7. Desplegar en Vercel
# Conectar el repositorio en vercel.com → Configurar variables de entorno → Deploy
```

### 13.3 Arquitectura de Despliegue

```
┌────────────────────────┐
│   Vercel (Edge Network)│
│   ┌──────────────────┐ │
│   │ Next.js App      │ │◀── Git push → Deploy automático
│   │ (SSR + API Routes│ │
│   │  + Cron Jobs)    │ │
│   └────────┬─────────┘ │
└────────────┼───────────┘
             │ HTTPS (API REST)
┌────────────┼───────────┐
│   Supabase │           │
│   ┌────────┴─────────┐ │
│   │ PostgreSQL + Auth│ │
│   │ + Storage        │ │
│   └──────────────────┘ │
└────────────────────────┘
```

---

## 14. Glosario Técnico

| Término | Definición |
|---------|-----------|
| **SSR (Server-Side Rendering)** | Técnica donde el HTML se genera en el servidor antes de enviarlo al navegador, mejorando la velocidad de carga inicial y el SEO. |
| **PWA (Progressive Web App)** | Aplicación web que puede instalarse como app nativa, funcionar offline y recibir notificaciones push. |
| **RLS (Row Level Security)** | Mecanismo de PostgreSQL que restringe el acceso a filas individuales de una tabla basándose en el usuario autenticado. |
| **JWT (JSON Web Token)** | Estándar para transmitir información de autenticación de forma segura entre el cliente y el servidor. |
| **Server Action** | Función de Next.js que se ejecuta en el servidor pero puede invocarse directamente desde un componente del cliente, sin necesidad de crear un endpoint API. |
| **Server Component** | Componente React que se renderiza completamente en el servidor, reduciendo el JavaScript enviado al navegador. |
| **Trigger (PostgreSQL)** | Función que se ejecuta automáticamente cuando ocurre un evento (INSERT, UPDATE, DELETE) en una tabla. |
| **ENUM (PostgreSQL)** | Tipo de dato personalizado que solo acepta valores de una lista predefinida, garantizando integridad. |
| **VAPID** | Protocolo estándar W3C para identificar servidores de notificaciones push. Funciona con cualquier navegador moderno sin depender de servicios de terceros. |
| **Service Worker** | Script JavaScript que se ejecuta en segundo plano en el navegador, independiente de la página web, permitiendo funcionalidad offline y notificaciones push. |
| **Condición de Carrera (Race Condition)** | Error que ocurre cuando dos procesos intentan acceder/modificar el mismo recurso simultáneamente sin sincronización adecuada. |
| **`FOR UPDATE SKIP LOCKED`** | Cláusula SQL que bloquea una fila para la transacción actual. Si la fila ya está bloqueada por otra transacción, la salta y busca la siguiente, evitando bloqueos mutuos. |
| **ACID** | Propiedades de las transacciones de base de datos: **A**tomicidad (todo o nada), **C**onsistencia (datos siempre válidos), **I**solamiento (transacciones no interfieren entre sí), **D**urabilidad (datos persisten tras confirmar). |
| **BaaS (Backend as a Service)** | Plataforma que provee funcionalidades de backend (base de datos, autenticación, almacenamiento) listas para usar, reduciendo la necesidad de programar un servidor desde cero. |

---

## 15. Preguntas Frecuentes de Jurado

### P1: ¿Por qué no usaron un framework tradicional como PHP+MySQL?

**R:** La combinación Next.js + Supabase ofrece ventajas significativas para este caso de uso:

1. **Seguridad por defecto:** Row Level Security en PostgreSQL garantiza que las reglas de acceso se aplican en la base de datos, no solo en el código del servidor. Un error en el backend PHP podría exponer datos; con RLS, es imposible.
2. **Rendimiento:** Server Components de React eliminan el JavaScript innecesario del navegador. Un catálogo con 500 libros se renderiza en el servidor y se envía como HTML puro.
3. **Experiencia de usuario:** La PWA permite que el sistema se instale como una app nativa y funcione parcialmente sin conexión.
4. **Menor tiempo de desarrollo:** Supabase genera automáticamente una API REST para cada tabla, elimina la necesidad de escribir controladores, modelos y rutas manualmente.

### P2: ¿Cómo garantizan que dos estudiantes no puedan solicitar la misma copia?

**R:** Mediante el procedimiento almacenado `rpc_request_loan` que usa `SELECT ... FOR UPDATE SKIP LOCKED`. Este mecanismo de **bloqueo pesimista** a nivel de PostgreSQL garantiza que:

- La primera transacción bloquea la fila de la copia disponible.
- La segunda transacción, en lugar de esperar, salta esa fila y busca otra copia disponible.
- Si no hay más copias, retorna un error claro: "No hay copias físicas disponibles en este momento."
- Toda la operación es atómica: si alguna validación falla, la transacción se revierte completamente.

### P3: ¿Qué pasa si un estudiante no devuelve un libro a tiempo?

**R:** El sistema aplica automáticamente una **suspensión de 1 mes**:

1. Al registrar la devolución, el Server Action calcula si `returned_at > due_at`.
2. Si es tardía, el estado del préstamo cambia a `vencido`.
3. El perfil del estudiante cambia a `status = 'bloqueado'` con `suspended_until = now() + 1 mes`.
4. Se registra en `audit_log` con los días de mora exactos.
5. **Auto-desbloqueo:** La próxima vez que el estudiante intente solicitar un libro, el trigger `assert_loan_rules` verifica si `now() >= suspended_until` y, de ser así, reactiva la cuenta automáticamente.

### P4: ¿El sistema funciona sin internet?

**R:** Parcialmente. Gracias al Service Worker y al caché del navegador:

- **Sí funciona offline:** Consultas al catálogo que ya se hayan realizado previamente (los resultados se cachean localmente).
- **No funciona offline:** Solicitar préstamos, renovar, aprobar solicitudes o cualquier operación que requiera escribir en la base de datos.
- **Importante:** La disponibilidad mostrada en modo offline es estimada y no se garantiza hasta la reconexión.

### P5: ¿Cómo se protegen los datos sensibles?

**R:** Se implementan múltiples capas de seguridad:

| Capa | Mecanismo |
|------|-----------|
| **Autenticación** | JWT firmado por Supabase + cookies HTTP-only (no accesibles por JavaScript) |
| **Autorización a nivel de BD** | Políticas RLS en PostgreSQL que filtran filas según el usuario autenticado |
| **Autorización a nivel de app** | Server Actions validan el rol del usuario antes de ejecutar operaciones |
| **Contraseñas** | Cifradas con bcrypt por Supabase Auth (nunca en texto plano) |
| **Variables sensibles** | Almacenadas como variables de entorno en Vercel, nunca en el código fuente |
| **Auditoría** | Toda operación crítica se registra en `audit_log` con actor, acción, fecha y datos antes/después |

### P6: ¿Qué métricas podrían generarse con este sistema?

**R:** El modelo de datos permite generar:

- **Top 10 de libros más solicitados** (consulta a `loans` agrupada por `book_id`).
- **Tasa de cumplimiento de devoluciones** (préstamos `devuelto` vs `vencido`).
- **Estudiantes con mayor actividad** (conteo de préstamos por `user_id`).
- **Ocupación del inventario** (copias prestadas vs disponibles por categoría).
- **Histórico de sanciones** (consulta a `audit_log` filtrando por `action = 'suspension_devolucion_tardia'`).

### P7: ¿Cómo escalaría el sistema si aumenta la cantidad de usuarios?

**R:** La arquitectura elegida soporta escalamiento:

1. **Vercel Edge Network:** Distribuye el contenido estático globalmente vía CDN. Las páginas SSR se cachean automáticamente.
2. **Supabase (PostgreSQL):** Soporta miles de conexiones concurrentes. Los índices creados (`idx_loans_user_status`, `idx_loans_due_at`, etc.) optimizan las consultas más frecuentes.
3. **Server Components:** Reducen la carga del navegador al renderizar HTML en el servidor, permitiendo que dispositivos de gama baja funcionen correctamente.
4. **Vista `catalog_view`:** Pre-calcula las agregaciones del catálogo, evitando JOINs costosos en cada consulta.

### P8: ¿Qué mejoras futuras podrían implementarse?

**R:** El sistema está diseñado para extenderse con:

1. **Escáner QR** (`html5-qrcode`): Para escanear credenciales de estudiantes y etiquetas de libros desde la cámara del dispositivo.
2. **Exportación de reportes a PDF/Excel**: Usando bibliotecas de generación de documentos.
3. **Integración con correo electrónico**: Enviar resúmenes semanales de actividad bibliotecaria.
4. **Estadísticas con gráficos**: Dashboard administrativo con métricas visuales.
5. **Sistema de recomendaciones**: Sugerir libros basándose en el historial de préstamos del estudiante.

---

> **Nota final:** Este documento está pensado como guía de apoyo para la defensa oral del trabajo de grado. Se recomienda complementarlo con capturas de pantalla del sistema en funcionamiento y una demostración en vivo durante la presentación.
