-- Migración para corregir la recursión infinita en las políticas RLS
-- y asegurar que los roles se detecten correctamente.

begin;

-- ==========================================
-- 1. ACTUALIZAR FUNCIONES CON SECURITY DEFINER
-- ==========================================
-- Esto permite que las funciones consulten las tablas ignorando las políticas RLS,
-- evitando la recursión infinita cuando la función es llamada DESDE una política.

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'invitado'::public.app_role
  )
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('bibliotecario'::public.app_role, 'administrador'::public.app_role)
$$;

create or replace function public.unpaid_fines_total(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)
  from public.fines
  where user_id = p_user_id and status = 'pendiente'
$$;

create or replace function public.active_loan_limit_reached(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select max_active_loans from public.loan_parameters where id = 1
  )
  select count(*) >= (select max_active_loans from params)
  from public.loans
  where user_id = p_user_id
    and status in ('solicitado', 'aprobado', 'entregado', 'vencido', 'multado')
$$;

commit;
