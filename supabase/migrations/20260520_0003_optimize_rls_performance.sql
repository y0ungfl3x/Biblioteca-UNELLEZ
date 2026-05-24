-- Optimizando funciones y políticas RLS para mejor rendimiento
-- Esta migración resuelve las advertencias de rendimiento en Supabase
-- envolviendo llamadas a auth.uid(), auth.role() y funciones personalizadas en subconsultas (SELECT ...).

begin;

-- 1. Optimizar función current_role
create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select coalesce((select p.role from public.profiles p where p.id = (select auth.uid())), 'invitado'::public.app_role)
$$;

-- 2. Actualizar políticas de PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select
using ((select auth.uid()) = id or (select public.is_staff_or_admin()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update
using ((select auth.uid()) = id or (select public.is_staff_or_admin()))
with check ((select auth.uid()) = id or (select public.is_staff_or_admin()));

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
for insert
with check ((select public.current_role()) = 'administrador');

-- 3. Actualizar políticas de CATEGORIES
drop policy if exists categories_manage_staff on public.categories;
create policy categories_manage_staff on public.categories
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 4. Actualizar políticas de AUTHORS
drop policy if exists authors_manage_staff on public.authors;
create policy authors_manage_staff on public.authors
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 5. Actualizar políticas de BOOKS
drop policy if exists books_manage_staff on public.books;
create policy books_manage_staff on public.books
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 6. Actualizar políticas de BOOK_AUTHORS
drop policy if exists book_authors_manage_staff on public.book_authors;
create policy book_authors_manage_staff on public.book_authors
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 7. Actualizar políticas de PHYSICAL_COPIES
drop policy if exists copies_manage_staff on public.physical_copies;
create policy copies_manage_staff on public.physical_copies
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 8. Actualizar políticas de EBOOKS
drop policy if exists ebooks_read_policy on public.ebooks;
create policy ebooks_read_policy on public.ebooks
for select
using (
  is_active and (
    access_level = 'publico'
    or ((select auth.uid()) is not null and access_level = 'comunidad')
    or (select public.is_staff_or_admin())
  )
);

drop policy if exists ebooks_manage_staff on public.ebooks;
create policy ebooks_manage_staff on public.ebooks
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 9. Actualizar políticas de LOANS
drop policy if exists loans_read_policy on public.loans;
create policy loans_read_policy on public.loans
for select
using ((select auth.uid()) = user_id or (select public.is_staff_or_admin()));

drop policy if exists loans_insert_student on public.loans;
create policy loans_insert_student on public.loans
for insert
with check (
  (select auth.uid()) = user_id
  and (select public.current_role()) = 'estudiante'
  and status = 'solicitado'
);

drop policy if exists loans_update_staff on public.loans;
create policy loans_update_staff on public.loans
for update
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 10. Actualizar políticas de RESERVATIONS
drop policy if exists reservations_read_policy on public.reservations;
create policy reservations_read_policy on public.reservations
for select
using ((select auth.uid()) = user_id or (select public.is_staff_or_admin()));

drop policy if exists reservations_insert_student on public.reservations;
create policy reservations_insert_student on public.reservations
for insert
with check (
  (select auth.uid()) = user_id
  and (select public.current_role()) = 'estudiante'
  and status = 'activa'
);

drop policy if exists reservations_update_policy on public.reservations;
create policy reservations_update_policy on public.reservations
for update
using ((select auth.uid()) = user_id or (select public.is_staff_or_admin()))
with check ((select auth.uid()) = user_id or (select public.is_staff_or_admin()));

-- 11. Actualizar políticas de FINES
drop policy if exists fines_read_policy on public.fines;
create policy fines_read_policy on public.fines
for select
using ((select auth.uid()) = user_id or (select public.is_staff_or_admin()));

drop policy if exists fines_manage_staff on public.fines;
create policy fines_manage_staff on public.fines
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 12. Actualizar políticas de EBOOK_READS
drop policy if exists ebook_reads_select_policy on public.ebook_reads;
create policy ebook_reads_select_policy on public.ebook_reads
for select
using ((select auth.uid()) = user_id or (select public.is_staff_or_admin()));

-- 13. Actualizar políticas de NOTIFICATIONS
drop policy if exists notifications_read_policy on public.notifications;
create policy notifications_read_policy on public.notifications
for select
using ((select auth.uid()) = user_id or (select public.is_staff_or_admin()));

drop policy if exists notifications_manage_staff on public.notifications;
create policy notifications_manage_staff on public.notifications
for all
using ((select public.is_staff_or_admin()))
with check ((select public.is_staff_or_admin()));

-- 14. Actualizar políticas de AUDIT_LOG
drop policy if exists audit_read_staff on public.audit_log;
create policy audit_read_staff on public.audit_log
for select
using ((select public.is_staff_or_admin()));

drop policy if exists audit_insert_service_or_staff on public.audit_log;
create policy audit_insert_service_or_staff on public.audit_log
for insert
with check (
  (select public.is_staff_or_admin())
  or (select auth.role()) = 'service_role'
);

commit;
