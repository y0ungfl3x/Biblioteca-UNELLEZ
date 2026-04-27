import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { error } = await supabase.from('ebooks').update({ access_level: 'publico' }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Update ebooks access level:", error || "Success");
}

fix();
