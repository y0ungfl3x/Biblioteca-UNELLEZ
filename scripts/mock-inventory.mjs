import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DUMMY_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

async function mock() {
  console.log("Fetching all books...");
  const { data: books, error } = await supabase.from('books').select('id');
  if (error) { console.error(error); return; }

  console.log(`Found ${books.length} books. Generating inventory...`);

  let physicalCount = 0;
  let ebookCount = 0;

  for (const book of books) {
    // 70% chance to have physical copies
    if (Math.random() > 0.3) {
      const numCopies = Math.floor(Math.random() * 5) + 1; // 1 to 5 copies
      for (let i = 0; i < numCopies; i++) {
        const { error: phyErr } = await supabase.from('physical_copies').insert({
          book_id: book.id,
          inventory_code: `PHY-${book.id.substring(0,4).toUpperCase()}-${Math.floor(Math.random()*1000000)}`,
          status: 'disponible',
          condition_note: 'bueno'
        });
        if (phyErr) console.error("Phy error:", phyErr);
        else physicalCount++;
      }
    }

    // 40% chance to have an e-book
    if (Math.random() > 0.6) {
      const { error: ebErr } = await supabase.from('ebooks').insert({
        book_id: book.id,
        storage_path: `${DUMMY_PDF_URL}?id=${book.id}`,
        filesize_bytes: 1048576, // 1 MB
        format: 'pdf',
        is_active: true
      });
      if (ebErr) console.error("Ebook error:", ebErr);
      else ebookCount++;
    }
  }

  console.log(`Successfully generated ${physicalCount} physical copies and ${ebookCount} e-books!`);
}

mock();
