-- Migración para solucionar condiciones de carrera y mejorar la gestión de inventario
-- 1. Actualizar el disparador de sincronización de estado de copias
-- 2. Reforzar las reglas de validación en los préstamos
-- 3. Crear una función RPC para procesar solicitudes de préstamo de forma atómica

begin;

-- ==========================================
-- 1. ACTUALIZAR SINCRONIZACIÓN DE ESTADO
-- ==========================================
create or replace function public.sync_copy_status_from_loan()
returns trigger
language plpgsql
as $$
begin
  -- Si el préstamo se solicita o aprueba, la copia queda RESERVADA
  if new.status in ('solicitado', 'aprobado') then
    update public.physical_copies
    set status = 'reservado'
    where id = new.copy_id;
  -- Si se entrega (o pasa a mora), la copia queda PRESTADA
  elsif new.status in ('entregado', 'vencido', 'multado') then
    update public.physical_copies
    set status = 'prestado'
    where id = new.copy_id;
  -- Si se devuelve, rechaza o cancela, la copia vuelve a estar DISPONIBLE
  elsif new.status in ('devuelto', 'rechazado', 'cancelado') then
    update public.physical_copies
    set status = 'disponible'
    where id = new.copy_id;
  end if;

  return new;
end;
$$;

-- ==========================================
-- 2. REFORZAR REGLAS DE VALIDACIÓN (assert_loan_rules)
-- ==========================================
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
    -- Excepción: si es una actualización del mismo préstamo que ya tiene la copia (ej. de solicitado a aprobado)
    -- En ese caso el status actual de la copia ya será 'reservado' por el trigger sync_copy_status.
    -- Pero si venimos de un INSERT (TG_OP = 'INSERT'), definitivamente debe estar 'disponible'.
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

-- ==========================================
-- 3. RPC PARA SOLICITUD ATÓMICA (fija la condición de carrera)
-- ==========================================
create or replace function public.rpc_request_loan(p_book_id uuid)
returns json
language plpgsql
security definer -- Se ejecuta con permisos de owner para poder actualizar copias y leer perfiles
set search_path = public
as $$
declare
  v_user_id uuid;
  v_copy_id uuid;
  v_loan_id uuid;
begin
  -- 1. Obtener el ID del usuario actual de la sesión de Supabase
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('error', 'No autenticado');
  end if;

  -- 2. Verificar si el usuario ya tiene este mismo libro (solicitado o activo)
  -- Esto evita duplicados antes de intentar reservar
  if exists (
    select 1 from public.loans l
    join public.physical_copies pc on l.copy_id = pc.id
    where l.user_id = v_user_id 
      and pc.book_id = p_book_id
      and l.status in ('solicitado', 'aprobado', 'entregado', 'vencido', 'multado')
  ) then
    return json_build_object('error', 'Ya tienes un préstamo o solicitud activa para este libro.');
  end if;

  -- 3. Buscar y BLOQUEAR una copia disponible
  -- El 'FOR UPDATE SKIP LOCKED' evita que dos transacciones peleen por el mismo registro; 
  -- la segunda transacción simplemente saltará el registro bloqueado por la primera y buscará el siguiente.
  select id into v_copy_id
  from public.physical_copies
  where book_id = p_book_id and status = 'disponible'
  order by created_at asc
  limit 1
  for update skip locked;

  if v_copy_id is null then
    return json_build_object('error', 'No hay copias físicas disponibles en este momento.');
  end if;

  -- 4. Insertar el préstamo
  -- El disparador 'assert_loan_rules' se ejecutará aquí y validará límites de usuario, etc.
  -- Si falla, lanzará una excepción que abortará toda la función rpc.
  begin
    insert into public.loans (user_id, copy_id, status, mode)
    values (v_user_id, v_copy_id, 'solicitado', 'externa')
    returning id into v_loan_id;
  exception when others then
    return json_build_object('error', SQLERRM);
  end;

  -- 5. Retornar éxito
  return json_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'message', '¡Solicitud de préstamo enviada con éxito!'
  );
end;
$$;

-- Dar permisos para ejecutar el RPC
grant execute on function public.rpc_request_loan(uuid) to authenticated;

commit;
