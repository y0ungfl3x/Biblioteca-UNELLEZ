import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // Login as admin
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@unellez.edu.ve',
    password: 'password123'
  });
  
  if (loginErr) { console.error('Login error:', loginErr.message); return; }

  // Fetch profiles
  const { data, error } = await supabase.from('profiles').select('role').eq('id', loginData.user.id).single();
  console.log('Single profile error:', error?.message);
  console.log('Single profile data:', data);

  const { data: allData, error: allErr } = await supabase.from('profiles').select('*');
  console.log('All profiles error:', allErr?.message);
}

test();
