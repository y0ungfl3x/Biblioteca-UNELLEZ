import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clean() {
  // Wipe out categories, which will cascade to books if foreign key is set to cascade,
  // but wait, books.category_id is not ON DELETE CASCADE.
  // We must delete books first.
  console.log("Deletings books...");
  await supabase.from('books').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Deletings categories...");
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Clean up finished!");
}

clean();
