# Modulo de Prestamos

## Descripcion general

El modulo de prestamos permite a los estudiantes solicitar libros fisicos disponibles en la biblioteca UNELLEZ. Un bibliotecario gestiona las aprobaciones y devoluciones desde su panel de control. El sistema aplica reglas de negocio automaticas para limitar el acceso y sancionar incumplimientos.

---

## Reglas de negocio

### Limites por estudiante

- Cada estudiante puede tener un maximo de **3 libros** activos en prestamo o solicitud de forma simultanea.
- El plazo maximo de prestamo es de **3 dias** a partir de la fecha de entrega fisica.

### Sanciones por devolucion tardia

- Si un estudiante devuelve un libro despues de la fecha de vencimiento (`returned_at > due_at`), el sistema aplica automaticamente una **suspension de 1 mes**.
- Durante la suspension:
  - El perfil del estudiante cambia a estado `bloqueado`.
  - Se registra el campo `suspended_until` con la fecha exacta de fin de la sancion (`now() + 1 month`).
  - No puede solicitar ni renovar libros.
- Toda sancion queda registrada en `public.audit_log` con los dias de mora y la fecha de finalizacion.

### Auto-desbloqueo

- Al intentar una nueva solicitud, si la fecha actual supera `suspended_until`, el sistema reactiva el perfil automaticamente a `activo` y limpia la sancion sin intervencion manual.

---

## Flujo de un prestamo

1. Estudiante solicita un libro disponible desde su dashboard.
2. El bibliotecario aprueba o rechaza la solicitud.
3. Al aprobar, el sistema fija `due_at = now() + 3 dias`.
4. El estudiante recoge el libro fisicamente.
5. Al devolver, el bibliotecario registra la devolucion.
   - Si es a tiempo: prestamo finaliza normalmente.
   - Si es tarde: se aplica la sancion de 1 mes automaticamente.

---

## Estructura de tablas involucradas

- `loans`: registro de cada prestamo con su estado, fechas y referencia al usuario y copia fisica.
- `physical_copies`: cada ejemplar prestable con su estado actual (`disponible`, `prestado`, etc.).
- `profiles`: perfil del estudiante con campos `status` y `suspended_until`.
- `loan_parameters`: parametros configurables del sistema (id = 1): `max_active_loans = 3`, `loan_days = 3`.
- `audit_log`: registro de eventos importantes como sanciones aplicadas.

---

## Estados de un prestamo

| Estado      | Descripcion                                      |
|-------------|--------------------------------------------------|
| `pendiente` | Solicitud enviada, esperando aprobacion          |
| `entregado` | Libro entregado al estudiante, plazo en curso    |
| `devuelto`  | Libro devuelto correctamente                     |
| `rechazado` | Solicitud rechazada por el bibliotecario         |
| `vencido`   | Devolucion fuera de plazo, sancion aplicada      |

---

## Renovacion

- Un estudiante puede solicitar la renovacion de un prestamo activo.
- La renovacion extiende la fecha de vencimiento **3 dias adicionales**.
- No se permite renovar si:
  - El estudiante tiene una sancion activa.
  - El libro tiene reservas pendientes de otros usuarios.

---

## Vistas del sistema

### Dashboard del estudiante (`/dashboard/my-loans`)

- Lista de prestamos activos, pendientes e historicos.
- Badge con estado y fecha de vencimiento de cada prestamo.
- Banner de alerta si la cuenta esta suspendida, indicando la fecha de reactivacion.
- Boton de renovacion para prestamos activos (cuando aplica).

### Panel del bibliotecario (`/dashboard/loans`)

- Lista completa de prestamos con filtros por estado.
- Alerta visual para prestamos en mora (mas de 3 dias sin devolucion).
- Confirmacion explicita al registrar una devolucion tardia, advirtiendo que se aplicara la sancion al estudiante.
