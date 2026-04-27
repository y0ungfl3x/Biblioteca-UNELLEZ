drop view if exists public.catalog_view;

create view public.catalog_view as
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
