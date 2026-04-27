# Requisitos Funcionales y Reglas de Negocio - UNELLEZ Biblioteca

## 1. Roles del Sistema

1. **Invitado:** Acceso público de solo lectura al catálogo de libros.
2. **Estudiante:** Miembro de la comunidad UNELLEZ con capacidad de reservar y gestionar préstamos propios.
3. **Bibliotecario:** Personal operativo encargado de entregar/recibir libros físicos y gestionar el inventario local.
4. **Administrador:** Superusuario para configuración del sistema y gestión de cuentas.

## 2. Requisitos Funcionales (RF)

### Módulo: Autenticación

- **RF01:** Registro e inicio de sesión utilizando Cédula de Identidad y contraseña.
- **RF02:** Asignación de roles y permisos basados en los metadatos del perfil de usuario.
- **RF03:** Recuperación de contraseña y cierre de sesión en múltiples dispositivos.

### Módulo: Catálogo y Préstamos

- **RF04:** Buscador de libros por título, autor, tema o categoría.
- **RF05:** Visualización del estado de inventario en tiempo real (Disponible, Prestado, En Reparación).
- **RF06:** [Estudiante] Solicitar préstamo online de hasta un máximo de 5 libros simultáneos.
- **RF07:** [Estudiante] Panel histórico de préstamos y opción de renovar un préstamo activo (si no hay reservas en cola).
- **RF08:** [Bibliotecario] Interfaz de despacho rápido para entregar/recibir libros y aprobar/rechazar solicitudes online.
- **RF09:** [Bibliotecario/Admin] Panel Kanban o lista de préstamos activos con alertas de vencimiento.
- **RF10:** [Admin] Gestión completa (CRUD) del inventario físico y catálogo de libros.
- **RF11:** [Admin] Configuración de parámetros globales: límite de libros, días de préstamo, costo de multa diaria.

### Módulo: Estados del Préstamo y Reservas

- **RF12:** El sistema debe manejar explícitamente los estados del flujo: Solicitado, Aprobado, Entregado, Vencido, Devuelto, Multado y Bloqueado.
- **RF13:** Las transiciones de estado deben quedar restringidas por rol y evento: el estudiante crea solicitudes; el bibliotecario aprueba, entrega y recibe; el sistema marca vencido y genera multas; el administrador puede bloquear o desbloquear cuentas y ajustar parámetros.
- **RF14:** Cada cambio de estado debe registrarse con fecha, usuario, rol, motivo y evento disparador para trazabilidad completa.

### Módulo: Notificaciones

- **RF15:** Alertas tempranas al estudiante 24h antes del vencimiento de su entrega.
- **RF16:** Notificación al estudiante cuando un libro en lista de espera pase a estar disponible.
- **RF17:** Notificación inmediata sobre la generación de una multa por retraso.

### Módulo: Reportes

- **RF18:** Generación de reportes de préstamos por rango de fechas.
- **RF19:** Estadísticas del Top 10 de libros más solicitados.
- **RF20:** Listado consolidado de estudiantes en estado de morosidad.
- **RF21:** Exportación de reportes a PDF/Excel.

### Módulo: Funcionalidades Móviles (PWA)

- **RF22:** Modo offline (caché de lectura) para buscar libros sin conexión a internet, mostrando la disponibilidad como estimada y no garantizada hasta la reconexión.
- **RF23:** Instalación de la PWA en pantalla de inicio.
- **RF24:** Lector de códigos QR integrado a la cámara para escaneo rápido de credenciales y etiquetas de libros.

## 3. Reglas de Negocio (RN)

- **RN01:** Libros clasificados como "Referencia" no aplican para préstamo externo.
- **RN02:** Estudiantes con multas pendientes > Bs. 10.00 quedan bloqueados para nuevas solicitudes.
- **RN03:** Préstamos vencidos generan una multa monetaria acumulativa automáticamente cada día.
- **RN04:** El sistema debe prevenir asignaciones duplicadas usando bloqueos transaccionales en PostgreSQL y una cola de reservas cuando múltiples usuarios soliciten la última copia disponible simultáneamente.

## 4. Requisitos No Funcionales (RNF)

- **RNF01:** El sistema debe aplicar controles de seguridad como contraseñas cifradas, sesiones seguras por cookies, expiración de sesión, protección contra fuerza bruta y registro de intentos de acceso.
- **RNF02:** Toda operación crítica debe generar auditoría obligatoria para préstamo, devolución, multa, cambio de parámetros y bloqueo/desbloqueo de usuarios.
- **RNF03:** La auditoría debe almacenar usuario, rol, acción, fecha, origen de la solicitud y antes/después del cambio cuando aplique.
- **RNF04:** Los procesos automáticos de multas y notificaciones deben ser idempotentes para evitar duplicados ante reintentos o ejecuciones repetidas.
