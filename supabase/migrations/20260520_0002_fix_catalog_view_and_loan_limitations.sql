-- Migración SQL para Biblioteca UNELLEZ
-- 1. Corrige la alerta de seguridad "SECURITY DEFINER" en catalog_view.
-- 2. Configura los nuevos límites: máximo 3 libros, duración de 3 días.
-- 3. Agrega la columna de sanción 'suspended_until' y ajusta el disparador.

begin;

-- ==========================================
-- 1. CORRECCIÓN DE ALERTA DE SEGURIDAD (catalog_view)
-- ==========================================
-- Eliminar la vista anterior para redefinirla
drop view if exists public.catalog_view;

-- Crear la vista especificando 'with (security_invoker = true)'
-- Esto fuerza a que se respeten las políticas RLS del usuario que realiza la consulta.
create view public.catalog_view with (security_invoker = true) as
select
  b.id,
  b.code,
  b.title,
  b.subtitle,
  b.topic,
  b.language,
  b.is_reference,
  b.material_type,
  c.name as category,
  coalesce(string_agg(distinct a.full_name, ', '), '') as authors,
  count(pc.id) filter (where pc.status = 'disponible') as physical_available,
  count(pc.id) as physical_total,
  count(e.id) filter (where e.is_active) as ebooks_total,
  b.cover_image_path
from public.books b
left join public.categories c on b.category_id = c.id
left join public.book_authors ba on b.id = ba.book_id
left join public.authors a on ba.author_id = a.id
left join public.physical_copies pc on b.id = pc.book_id
left join public.ebooks e on b.id = e.book_id
group by b.id, c.id;

-- Volver a otorgar permisos de lectura a los roles público y autenticado
grant select on public.catalog_view to anon, authenticated;


-- ==========================================
-- 2. NUEVOS LÍMITES DE PRÉSTAMOS Y DURACIÓN
-- ==========================================
-- Actualizar la tabla de parámetros (id = 1) a: max 3 libros, 3 días
update public.loan_parameters
set max_active_loans = 3,
    loan_days = 3
where id = 1;


-- ==========================================
-- 3. COLUMNA DE SANCIÓN EN PERFILES
-- ==========================================
-- Agregar la columna 'suspended_until' a profiles
alter table public.profiles 
add column if not exists suspended_until timestamptz default null;


-- ==========================================
-- 4. ADAPTACIÓN DE DISPARADOR 'assert_loan_rules'
-- ==========================================
-- Redefinir la función de validación para incluir las sanciones de 1 mes y el auto-desbloqueo
create or replace function public.assert_loan_rules()
returns trigger
language plpgsql
as $$
declare
  v_profile_status public.account_status;
  v_suspended_until timestamptz;
  v_is_reference boolean;
  v_copy_status public.copy_status;
  v_fine_limit numeric;
  v_loan_days integer;
begin
  -- Obtener el estado del perfil
  select p.status, p.suspended_until into v_profile_status, v_suspended_until
  from public.profiles p
  where p.id = new.user_id;

  if v_profile_status is null then
    raise exception 'El usuario del prestamo no existe en profiles';
  end if;

  -- AUTO-REACTIVACIÓN: Si la sanción ya expiró, desbloquear automáticamente
  if v_profile_status = 'bloqueado' and v_suspended_until is not null and now() >= v_suspended_until then
    update public.profiles
    set status = 'activo',
        suspended_until = null
    where id = new.user_id;
    
    v_profile_status := 'activo';
    v_suspended_until := null;
  end if;

  -- Obtener los parámetros globales actuales
  select fine_block_threshold, loan_days
  into v_fine_limit, v_loan_days
  from public.loan_parameters
  where id = 1;

  -- VALIDAR SANCIÓN ACTIVA: Si la fecha actual es anterior a la finalización de la sanción
  if v_suspended_until is not null and now() < v_suspended_until then
    raise exception 'El usuario se encuentra sancionado por entrega tardia hasta %', to_char(v_suspended_until, 'DD/MM/YYYY HH24:MI');
  end if;

  -- Validar bloqueo general de cuenta
  if v_profile_status = 'bloqueado' then
    raise exception 'El usuario se encuentra bloqueado';
  end if;

  -- Validar límite de multas acumuladas
  if public.unpaid_fines_total(new.user_id) > v_fine_limit then
    raise exception 'El usuario supera el limite de multas pendientes';
  end if;

  -- Validar límite de libros activos (ahora son 3 gracias a la actualización de parámetros)
  if new.status = 'solicitado' and public.active_loan_limit_reached(new.user_id) then
    raise exception 'El usuario alcanzo el maximo de prestamos activos (3)';
  end if;

  -- Validar ejemplar físico y tipo de préstamo
  select b.is_reference, c.status
  into v_is_reference, v_copy_status
  from public.physical_copies c
  join public.books b on b.id = c.book_id
  where c.id = new.copy_id;

  if new.mode = 'externa' and coalesce(v_is_reference, false) then
    raise exception 'Los libros de referencia no admiten prestamo externo';
  end if;

  if new.status in ('aprobado', 'entregado') and v_copy_status <> 'disponible' then
    raise exception 'El ejemplar no esta disponible para prestamo';
  end if;

  -- Asignar la fecha de vencimiento al entregar (ahora serán 3 días debido a loan_days)
  if new.status = 'entregado' and new.due_at is null then
    new.due_at = now() + make_interval(days => v_loan_days);
  end if;

  return new;
end;
$$;

commit;
