import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const { count: ebCount, error: e1 } = await supabase.from('ebooks').select('*', { count: 'exact', head: true });
  const { count: pcCount, error: e2 } = await supabase.from('physical_copies').select('*', { count: 'exact', head: true });
  
  console.log(`Total eBooks in table: ${ebCount}`);
  console.log(`Total Physical Copies in table: ${pcCount}`);
}

checkTables();
