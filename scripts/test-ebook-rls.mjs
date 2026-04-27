import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anonSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: cat } = await supabase.from('catalog_view').select('id, title, ebooks_total').gt('ebooks_total', 0).limit(1).single();
  console.log("Book with ebook from catalog_view:", cat);

  if (!cat) return;

  const { data: ebService, error: e1 } = await supabase.from('ebooks').select('*').eq('book_id', cat.id).single();
  console.log("Ebook via service role:", ebService, e1);

  const { data: ebAnon, error: e2 } = await anonSupabase.from('ebooks').select('*').eq('book_id', cat.id).single();
  console.log("Ebook via anon role:", ebAnon, e2);
}

test();
