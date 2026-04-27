import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan las variables de entorno de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@unellez.edu.ve';
  const password = 'password123';
  const cedula = '10101010';
  const fullName = 'Administrador del Sistema';
  
  console.log(`Intentando crear usuario administrador: ${email}`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      cedula: cedula,
      full_name: fullName,
      role: 'administrador'
    }
  });

  if (error) {
    console.error('Error al crear administrador:', error.message);
  } else {
    console.log('Administrador creado con éxito!');
    console.log('ID:', data.user.id);
    console.log('Email:', email);
    console.log('Contraseña:', password);
  }
}

createAdmin();
