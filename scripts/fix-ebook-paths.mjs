import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixPaths() {
  const { data: ebooks, error: e1 } = await supabase.from('ebooks').select('id, storage_path');
  if (e1) { console.error(e1); return; }

  let count = 0;
  for (const ebook of ebooks) {
    if (ebook.storage_path.includes('w3.org')) {
      const newPath = ebook.storage_path.replace('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '/dummy.pdf');
      await supabase.from('ebooks').update({ storage_path: newPath }).eq('id', ebook.id);
      count++;
    }
  }

  console.log(`Updated ${count} ebooks to use local /dummy.pdf`);
}

fixPaths();
