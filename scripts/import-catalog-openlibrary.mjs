import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function loadEnvFromFile(filename) {
  const fullPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function fetchOpenLibraryBooks(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    language: "spa",
  });

  const response = await fetch(
    `https://openlibrary.org/search.json?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Open Library respondio con ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.docs) ? data.docs : [];
}

function normalizeBook(doc, query) {
  const title = doc.title?.trim();
  if (!title) return null;

  const code = doc.key ? `OL-${String(doc.key).replaceAll("/", "-")}` : null;
  const authors = Array.isArray(doc.author_name)
    ? doc.author_name.map((name) => String(name).trim()).filter(Boolean)
    : [];
  const subjects = Array.isArray(doc.subject)
    ? doc.subject.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const formattedCategory = query
    ? query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : "General";

  return {
    code,
    title,
    publication_year: (Number.isInteger(doc.first_publish_year) && doc.first_publish_year > 0 && doc.first_publish_year <= new Date().getFullYear())
      ? doc.first_publish_year
      : null,
    isbn:
      Array.isArray(doc.isbn) && doc.isbn.length > 0
        ? String(doc.isbn[0])
        : null,
    language: "es",
    topic: subjects[0] ?? null,
    category: formattedCategory,
    material_type: "fisico",
    is_reference: false,
    cover_image_path: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    ia_id: Array.isArray(doc.ia) ? doc.ia[0] : null,
    authors,
  };
}

async function getOrCreateCategoryId(supabase, categoryName) {
  const { data: existing, error: selectError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from("categories")
    .insert({ name: categoryName })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}

async function getOrCreateAuthorId(supabase, fullName) {
  const { data: existing, error: selectError } = await supabase
    .from("authors")
    .select("id")
    .eq("full_name", fullName)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from("authors")
    .insert({ full_name: fullName })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}

async function upsertBook(supabase, normalizedBook) {
  const categoryId = await getOrCreateCategoryId(
    supabase,
    normalizedBook.category,
  );

  const payload = {
    code: normalizedBook.code,
    title: normalizedBook.title,
    publication_year: normalizedBook.publication_year,
    isbn: normalizedBook.isbn,
    language: normalizedBook.language,
    topic: normalizedBook.topic,
    category_id: categoryId,
    material_type: normalizedBook.material_type,
    is_reference: normalizedBook.is_reference,
    cover_image_path: normalizedBook.cover_image_path,
  };

  const { data: existing, error: findError } = await supabase
    .from("books")
    .select("id")
    .eq("code", normalizedBook.code)
    .maybeSingle();

  if (findError) throw findError;

  let bookId = existing?.id;
  if (!bookId) {
    const { data: inserted, error: insertError } = await supabase
      .from("books")
      .insert(payload)
      .select("id")
      .single();
    if (insertError) throw insertError;
    bookId = inserted.id;

    // --- AUTO INVENTORY SIMULATOR ---
    // 30% of having physical copies
    if (Math.random() > 0.7) {
      const numCopies = Math.floor(Math.random() * 5) + 1;
      const copies = [];
      for (let i = 0; i < numCopies; i++) {
        copies.push({
          book_id: bookId,
          inventory_code: `PHY-${bookId.substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
          status: 'disponible',
          condition_note: 'bueno'
        });
      }
      await supabase.from("physical_copies").insert(copies);
    }

    // 60% of having an e-book
    if (Math.random() > 0.4) {
      const realPath = normalizedBook.ia_id 
        ? `https://archive.org/embed/${normalizedBook.ia_id}`
        : `https://pbqheoljcawqpleciggf.supabase.co/storage/v1/object/public/ebooks/dummy.pdf?id=${bookId}`;

      await supabase.from("ebooks").insert({
        book_id: bookId,
        storage_path: realPath,
        filesize_bytes: 1048576,
        format: 'pdf',
        is_active: true,
        access_level: 'publico'
      });
    }
    // --------------------------------

  } else {
    await supabase.from("books").update(payload).eq("id", bookId);
  }

  for (const authorName of normalizedBook.authors) {
    const authorId = await getOrCreateAuthorId(supabase, authorName);
    const { error: relError } = await supabase
      .from("book_authors")
      .upsert(
        { book_id: bookId, author_id: authorId },
        { onConflict: "book_id,author_id" },
      );

    if (relError) throw relError;
  }

  return bookId;
}

async function main() {
  loadEnvFromFile(".env.local");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const query = process.argv[2] ?? "biblioteca";
  const limit = Number.parseInt(process.argv[3] ?? "25", 10);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const docs = await fetchOpenLibraryBooks(
    query,
    Number.isFinite(limit) ? limit : 25,
  );
  const normalized = docs.map((doc) => normalizeBook(doc, query)).filter(Boolean);

  let inserted = 0;
  for (const book of normalized) {
    if (!book.code) continue;

    await upsertBook(supabase, book);
    inserted += 1;
  }

  console.log(`Consulta: ${query}`);
  console.log(`Registros recuperados: ${docs.length}`);
  console.log(`Registros procesados: ${inserted}`);
}

main().catch((error) => {
  console.error("Fallo importando catalogo:", error.message);
  process.exit(1);
});
