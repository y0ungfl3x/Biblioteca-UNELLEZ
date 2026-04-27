import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: colsEbooks, error: err1 } = await supabase.rpc('get_schema_info', { table_name: 'ebooks' }).catch(() => ({}));
  if (err1) {
    console.error("RPC failed, attempting normal select of 1 row to see keys...");
  }
  
  const { data: eb } = await supabase.from('ebooks').select('*').limit(1);
  console.log("EBOOKS COLUMNS (if any row exists):", eb?.[0] ? Object.keys(eb[0]) : "No rows, but error was: " + JSON.stringify(eb));
  
  const { data: pc } = await supabase.from('physical_copies').select('*').limit(1);
  console.log("PHYSICAL_COPIES COLUMNS:", pc?.[0] ? Object.keys(pc[0]) : "No rows, but error was: " + JSON.stringify(pc));
}

checkSchema();
