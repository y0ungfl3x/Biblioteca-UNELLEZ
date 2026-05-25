import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log("Attempting login as admin...");
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@unellez.edu.ve',
    password: 'password123'
  });
  
  if (loginErr) { 
    console.error('Login error:', loginErr.message); 
    
    console.log("Trying to login as librarian...");
    const { data: libData, error: libErr } = await supabase.auth.signInWithPassword({
      email: 'bibliotecario@unellez.edu.ve',
      password: 'password123'
    });
    if (libErr) {
      console.error('Librarian login error:', libErr.message);
      return;
    }
    await runQueries(libData);
  } else {
    await runQueries(loginData);
  }
}

async function runQueries(loginData) {
  console.log("Logged in successfully. User ID:", loginData.user.id);
  
  // Single profile
  const { data: singleProfile, error: singleErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', loginData.user.id)
    .single();
  
  console.log('Single profile data:', singleProfile);
  console.log('Single profile error:', singleErr?.message || 'None');

  // All profiles
  const { data: allProfiles, error: allErr } = await supabase
    .from('profiles')
    .select('*');
  console.log('All profiles count:', allProfiles?.length || 0);
  console.log('All profiles error:', allErr?.message || 'None');

  // Loans list query identical to dashboard/loans/page.tsx
  const { data: loans, error: loansErr } = await supabase
    .from("loans")
    .select(`
      *,
      profile:profiles!loans_user_id_fkey(full_name, cedula),
      copy:physical_copies(
        inventory_code,
        book:books(title)
      )
    `);
  console.log('Loans query count:', loans?.length || 0);
  console.log('Loans query error:', loansErr?.message || 'None');
}

test();
