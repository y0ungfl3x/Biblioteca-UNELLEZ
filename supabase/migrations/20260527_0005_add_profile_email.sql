begin;

alter table public.profiles
add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, cedula, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'cedula', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'estudiante'::public.app_role)
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email);

  return new;
end;
$$;

commit;
