-- Migración para permitir devoluciones incluso si el usuario está sancionado.
-- El trigger assert_loan_rules bloqueaba cualquier actualización si el usuario ya estaba sancionado,
-- lo cual impedía que el bibliotecario marcara como 'devuelto' un libro de un estudiante ya bloqueado.

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

  -- PERMITIR DEVOLUCIONES: Si el estado cambia a 'devuelto' o 'vencido', 
  -- saltamos las validaciones de bloqueo para permitir la recepción.
  if new.status in ('devuelto', 'vencido') then
    return new;
  end if;

  -- Obtener los parámetros globales actuales
  select fine_block_threshold, loan_days
  into v_fine_limit, v_loan_days
  from public.loan_parameters
  where id = 1;

  -- VALIDAR SANCIÓN ACTIVA
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

  -- Validar límite de libros activos
  if new.status = 'solicitado' and public.active_loan_limit_reached(new.user_id) then
    raise exception 'El usuario alcanzo el maximo de prestamos activos';
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

  -- REFORZADO: No permitir 'solicitado' si no está disponible
  if new.status in ('solicitado', 'aprobado', 'entregado') and v_copy_status <> 'disponible' then
    if TG_OP = 'INSERT' or (v_copy_status <> 'reservado' and v_copy_status <> 'prestado') then
         raise exception 'El ejemplar no esta disponible para prestamo (Estado actual: %)', v_copy_status;
    end if;
  end if;

  -- Asignar la fecha de vencimiento al entregar
  if new.status = 'entregado' and new.due_at is null then
    new.due_at = now() + make_interval(days => v_loan_days);
  end if;

  return new;
end;
$$;
