import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupBucket() {
  // 1. Crear el bucket si no existe
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.find(b => b.name === 'ebooks');
  
  if (!exists) {
    console.log("Creating 'ebooks' bucket...");
    await supabase.storage.createBucket('ebooks', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'application/epub+zip'],
      fileSizeLimit: 52428800 // 50MB
    });
  } else {
    console.log("Bucket 'ebooks' already exists.");
  }

  // 2. Subir el archivo dummy
  const fileContent = fs.readFileSync('public/dummy.pdf');
  const { data, error } = await supabase.storage.from('ebooks').upload('dummy.pdf', fileContent, {
    contentType: 'application/pdf',
    upsert: true
  });

  if (error) {
    console.error("Error uploading to bucket:", error);
    return;
  }

  // 3. Obtener la URL pública
  const { data: { publicUrl } } = supabase.storage.from('ebooks').getPublicUrl('dummy.pdf');
  console.log("Public URL for dummy.pdf:", publicUrl);

  // 4. Actualizar la base de datos para usar la URL del bucket
  const { data: ebooks } = await supabase.from('ebooks').select('id, book_id');
  
  for (const eb of ebooks || []) {
    const bucketUrl = `${publicUrl}?id=${eb.book_id}`;
    await supabase.from('ebooks').update({ storage_path: bucketUrl }).eq('id', eb.id);
  }

  console.log("Successfully updated all ebooks to use Supabase Storage bucket URLs!");
}

setupBucket();
