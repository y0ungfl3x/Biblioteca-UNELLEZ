begin;

-- ==========================================
-- ACTUALIZAR POLÍTICAS DE PRÉSTAMOS
-- Los nuevos roles también pueden solicitar préstamos
-- ==========================================
drop policy if exists loans_insert_student on public.loans;
create policy loans_insert_student on public.loans
for insert
with check (
  (select auth.uid()) = user_id
  and (select public.current_role()) in ('estudiante'::public.app_role, 'docente'::public.app_role, 'administrativo'::public.app_role, 'obrero'::public.app_role)
  and status = 'solicitado'
);

-- ==========================================
-- ACTUALIZAR POLÍTICAS DE RESERVAS
-- Los nuevos roles también pueden hacer reservas
-- ==========================================
drop policy if exists reservations_insert_student on public.reservations;
create policy reservations_insert_student on public.reservations
for insert
with check (
  (select auth.uid()) = user_id
  and (select public.current_role()) in ('estudiante'::public.app_role, 'docente'::public.app_role, 'administrativo'::public.app_role, 'obrero'::public.app_role)
  and status = 'activa'
);

commit;
