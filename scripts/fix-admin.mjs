import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) { console.error(authErr); return; }
  
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) { console.error(profErr); return; }

  console.log("USERS IN AUTH:");
  users.forEach(u => console.log(u.email, u.id));

  console.log("\nPROFILES IN DB:");
  profiles.forEach(p => console.log(p.id, p.full_name, p.role));
}

check();
