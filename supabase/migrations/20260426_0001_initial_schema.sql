begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('invitado', 'estudiante', 'bibliotecario', 'administrador');
  end if;

  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('activo', 'bloqueado');
  end if;

  if not exists (select 1 from pg_type where typname = 'material_type') then
    create type public.material_type as enum ('fisico', 'electronico', 'mixto');
  end if;

  if not exists (select 1 from pg_type where typname = 'copy_status') then
    create type public.copy_status as enum ('disponible', 'prestado', 'reparacion', 'reservado', 'perdido', 'baja');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type public.loan_status as enum (
      'solicitado',
      'aprobado',
      'entregado',
      'vencido',
      'devuelto',
      'multado',
      'bloqueado',
      'rechazado',
      'cancelado'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_mode') then
    create type public.loan_mode as enum ('interna', 'externa');
  end if;

  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('activa', 'cumplida', 'cancelada', 'expirada');
  end if;

  if not exists (select 1 from pg_type where typname = 'ebook_access_level') then
    create type public.ebook_access_level as enum ('publico', 'comunidad', 'restringido');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cedula varchar(20) not null unique,
  full_name text not null,
  role public.app_role not null default 'estudiante',
  status public.account_status not null default 'activo',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.authors (
  id bigserial primary key,
  full_name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  title text not null,
  subtitle text,
  synopsis text,
  isbn text,
  publication_year integer check (publication_year between 1400 and extract(year from now())::integer + 1),
  publisher text,
  language text not null default 'es',
  topic text,
  category_id bigint references public.categories(id),
  material_type public.material_type not null default 'fisico',
  is_reference boolean not null default false,
  cover_image_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_authors (
  book_id uuid not null references public.books(id) on delete cascade,
  author_id bigint not null references public.authors(id) on delete restrict,
  primary key (book_id, author_id)
);

create table if not exists public.physical_copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  inventory_code text not null unique,
  status public.copy_status not null default 'disponible',
  location text not null default 'deposito_general',
  condition_note text,
  acquired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ebooks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  format text not null default 'pdf',
  storage_bucket text not null default 'ebooks',
  storage_path text not null unique,
  access_level public.ebook_access_level not null default 'comunidad',
  max_concurrent_reads integer,
  checksum text,
  filesize_bytes bigint,
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loan_parameters (
  id smallint primary key default 1 check (id = 1),
  max_active_loans integer not null default 5 check (max_active_loans > 0),
  loan_days integer not null default 7 check (loan_days > 0),
  daily_fine numeric(10,2) not null default 1.00 check (daily_fine >= 0),
  fine_block_threshold numeric(10,2) not null default 10.00 check (fine_block_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.loan_parameters (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  copy_id uuid not null references public.physical_copies(id) on delete restrict,
  status public.loan_status not null default 'solicitado',
  mode public.loan_mode not null default 'externa',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  delivered_at timestamptz,
  due_at timestamptz,
  returned_at timestamptz,
  approved_by uuid references public.profiles(id),
  delivered_by uuid references public.profiles(id),
  received_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loans_user_status on public.loans(user_id, status);
create index if not exists idx_loans_due_at on public.loans(due_at);
create index if not exists idx_loans_copy on public.loans(copy_id);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  book_id uuid not null references public.books(id) on delete restrict,
  status public.reservation_status not null default 'activa',
  queue_position integer,
  requested_at timestamptz not null default now(),
  expires_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_active_reservation_per_user_book
on public.reservations(user_id, book_id)
where status = 'activa';

create table if not exists public.fines (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(10,2) not null check (amount >= 0),
  reason text not null default 'Mora por retraso',
  status text not null default 'pendiente' check (status in ('pendiente', 'pagada', 'anulada')),
  generated_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fines_user_status on public.fines(user_id, status);

create table if not exists public.ebook_reads (
  id uuid primary key default gen_random_uuid(),
  ebook_id uuid not null references public.ebooks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  guest_session text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  check (user_id is not null or guest_session is not null)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms')),
  event_type text not null,
  title text not null,
  body text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'enviada', 'error')),
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_user_id uuid references public.profiles(id),
  actor_role public.app_role,
  action text not null,
  entity text not null,
  entity_id text not null,
  reason text,
  event_source text not null default 'app',
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_authors_updated_at on public.authors;
create trigger trg_authors_updated_at
before update on public.authors
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
before update on public.books
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_physical_copies_updated_at on public.physical_copies;
create trigger trg_physical_copies_updated_at
before update on public.physical_copies
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_ebooks_updated_at on public.ebooks;
create trigger trg_ebooks_updated_at
before update on public.ebooks
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_loan_parameters_updated_at on public.loan_parameters;
create trigger trg_loan_parameters_updated_at
before update on public.loan_parameters
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_loans_updated_at on public.loans;
create trigger trg_loans_updated_at
before update on public.loans
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
before update on public.reservations
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_fines_updated_at on public.fines;
create trigger trg_fines_updated_at
before update on public.fines
for each row execute procedure public.set_updated_at();

create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'invitado'::public.app_role)
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('bibliotecario'::public.app_role, 'administrador'::public.app_role)
$$;

create or replace function public.unpaid_fines_total(p_user_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(f.amount), 0)
  from public.fines f
  where f.user_id = p_user_id and f.status = 'pendiente'
$$;

create or replace function public.active_loan_limit_reached(p_user_id uuid)
returns boolean
language sql
stable
as $$
  with params as (
    select max_active_loans from public.loan_parameters where id = 1
  )
  select count(*) >= (select max_active_loans from params)
  from public.loans l
  where l.user_id = p_user_id
    and l.status in ('solicitado', 'aprobado', 'entregado', 'vencido', 'multado')
$$;

create or replace function public.assert_loan_rules()
returns trigger
language plpgsql
as $$
declare
  v_profile_status public.account_status;
  v_is_reference boolean;
  v_copy_status public.copy_status;
  v_fine_limit numeric;
  v_loan_days integer;
begin
  select p.status into v_profile_status
  from public.profiles p
  where p.id = new.user_id;

  if v_profile_status is null then
    raise exception 'El usuario del prestamo no existe en profiles';
  end if;

  select fine_block_threshold, loan_days
  into v_fine_limit, v_loan_days
  from public.loan_parameters
  where id = 1;

  if v_profile_status = 'bloqueado' then
    raise exception 'El usuario se encuentra bloqueado';
  end if;

  if public.unpaid_fines_total(new.user_id) > v_fine_limit then
    raise exception 'El usuario supera el limite de multas pendientes';
  end if;

  if new.status = 'solicitado' and public.active_loan_limit_reached(new.user_id) then
    raise exception 'El usuario alcanzo el maximo de prestamos activos';
  end if;

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

  if new.status = 'entregado' and new.due_at is null then
    new.due_at = now() + make_interval(days => v_loan_days);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assert_loan_rules on public.loans;
create trigger trg_assert_loan_rules
before insert or update of user_id, copy_id, status, mode on public.loans
for each row execute procedure public.assert_loan_rules();

create or replace function public.sync_copy_status_from_loan()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('entregado', 'vencido', 'multado') then
    update public.physical_copies
    set status = 'prestado'
    where id = new.copy_id;
  elsif new.status in ('devuelto', 'rechazado', 'cancelado') then
    update public.physical_copies
    set status = 'disponible'
    where id = new.copy_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_copy_status_from_loan on public.loans;
create trigger trg_sync_copy_status_from_loan
after insert or update of status on public.loans
for each row execute procedure public.sync_copy_status_from_loan();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, cedula, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'cedula', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'estudiante'::public.app_role)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.books enable row level security;
alter table public.book_authors enable row level security;
alter table public.physical_copies enable row level security;
alter table public.ebooks enable row level security;
alter table public.loan_parameters enable row level security;
alter table public.loans enable row level security;
alter table public.reservations enable row level security;
alter table public.fines enable row level security;
alter table public.ebook_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select
using (auth.uid() = id or public.is_staff_or_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update
using (auth.uid() = id or public.is_staff_or_admin())
with check (auth.uid() = id or public.is_staff_or_admin());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
for insert
with check (public.current_role() = 'administrador');

drop policy if exists categories_read_all on public.categories;
create policy categories_read_all on public.categories
for select
using (true);

drop policy if exists categories_manage_staff on public.categories;
create policy categories_manage_staff on public.categories
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists authors_read_all on public.authors;
create policy authors_read_all on public.authors
for select
using (true);

drop policy if exists authors_manage_staff on public.authors;
create policy authors_manage_staff on public.authors
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists books_read_all on public.books;
create policy books_read_all on public.books
for select
using (true);

drop policy if exists books_manage_staff on public.books;
create policy books_manage_staff on public.books
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists book_authors_read_all on public.book_authors;
create policy book_authors_read_all on public.book_authors
for select
using (true);

drop policy if exists book_authors_manage_staff on public.book_authors;
create policy book_authors_manage_staff on public.book_authors
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists copies_read_all on public.physical_copies;
create policy copies_read_all on public.physical_copies
for select
using (true);

drop policy if exists copies_manage_staff on public.physical_copies;
create policy copies_manage_staff on public.physical_copies
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists ebooks_read_policy on public.ebooks;
create policy ebooks_read_policy on public.ebooks
for select
using (
  is_active and (
    access_level = 'publico'
    or (auth.uid() is not null and access_level = 'comunidad')
    or public.is_staff_or_admin()
  )
);

drop policy if exists ebooks_manage_staff on public.ebooks;
create policy ebooks_manage_staff on public.ebooks
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists params_read_all on public.loan_parameters;
create policy params_read_all on public.loan_parameters
for select
using (true);

drop policy if exists params_admin_update on public.loan_parameters;
create policy params_admin_update on public.loan_parameters
for update
using (public.current_role() = 'administrador')
with check (public.current_role() = 'administrador');

drop policy if exists loans_read_policy on public.loans;
create policy loans_read_policy on public.loans
for select
using (auth.uid() = user_id or public.is_staff_or_admin());

drop policy if exists loans_insert_student on public.loans;
create policy loans_insert_student on public.loans
for insert
with check (
  auth.uid() = user_id
  and public.current_role() = 'estudiante'
  and status = 'solicitado'
);

drop policy if exists loans_update_staff on public.loans;
create policy loans_update_staff on public.loans
for update
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists reservations_read_policy on public.reservations;
create policy reservations_read_policy on public.reservations
for select
using (auth.uid() = user_id or public.is_staff_or_admin());

drop policy if exists reservations_insert_student on public.reservations;
create policy reservations_insert_student on public.reservations
for insert
with check (
  auth.uid() = user_id
  and public.current_role() = 'estudiante'
  and status = 'activa'
);

drop policy if exists reservations_update_policy on public.reservations;
create policy reservations_update_policy on public.reservations
for update
using (auth.uid() = user_id or public.is_staff_or_admin())
with check (auth.uid() = user_id or public.is_staff_or_admin());

drop policy if exists fines_read_policy on public.fines;
create policy fines_read_policy on public.fines
for select
using (auth.uid() = user_id or public.is_staff_or_admin());

drop policy if exists fines_manage_staff on public.fines;
create policy fines_manage_staff on public.fines
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists ebook_reads_insert_open on public.ebook_reads;
create policy ebook_reads_insert_open on public.ebook_reads
for insert
with check (true);

drop policy if exists ebook_reads_select_policy on public.ebook_reads;
create policy ebook_reads_select_policy on public.ebook_reads
for select
using (auth.uid() = user_id or public.is_staff_or_admin());

drop policy if exists notifications_read_policy on public.notifications;
create policy notifications_read_policy on public.notifications
for select
using (auth.uid() = user_id or public.is_staff_or_admin());

drop policy if exists notifications_manage_staff on public.notifications;
create policy notifications_manage_staff on public.notifications
for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists audit_read_staff on public.audit_log;
create policy audit_read_staff on public.audit_log
for select
using (public.is_staff_or_admin());

drop policy if exists audit_insert_service_or_staff on public.audit_log;
create policy audit_insert_service_or_staff on public.audit_log
for insert
with check (
  public.is_staff_or_admin()
  or auth.role() = 'service_role'
);

create or replace view public.catalog_view as
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
  count(e.id) filter (where e.is_active) as ebooks_total
from public.books b
left join public.categories c on c.id = b.category_id
left join public.book_authors ba on ba.book_id = b.id
left join public.authors a on a.id = ba.author_id
left join public.physical_copies pc on pc.book_id = b.id
left join public.ebooks e on e.book_id = b.id
group by b.id, c.name;

grant select on public.catalog_view to anon, authenticated;

commit;
