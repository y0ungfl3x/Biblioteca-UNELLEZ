import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('catalog_view').select('*').limit(5);
  if (error) {
    console.error("Error from catalog_view:", error);
    return;
  }
  
  console.log("CATALOG VIEW RESULTS:");
  data.forEach(b => {
    console.log(`- ${b.title} | Ebooks: ${b.ebooks_total} | Phys: ${b.physical_total} | PhysAvail: ${b.physical_available}`);
  });
}

check();
