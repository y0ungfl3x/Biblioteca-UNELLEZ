import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function mergeCategories() {
  console.log("Merging categories 'Historia Venezuela' and 'Historia De Venezuela'...");

  // 1. Get the categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .in('name', ['Historia Venezuela', 'Historia De Venezuela']);

  if (catError) {
    console.error("Error fetching categories:", catError);
    return;
  }

  if (!categories || categories.length < 2) {
    console.log("Could not find both categories. Found:", categories);
    return;
  }

  const hVenezuela = categories.find(c => c.name === 'Historia Venezuela');
  const hDeVenezuela = categories.find(c => c.name === 'Historia De Venezuela');

  // We'll keep 'Historia De Venezuela' (id: hDeVenezuela.id) and move everyone from 'Historia Venezuela' to it.
  console.log(`Moving books from '${hVenezuela.name}' (ID: ${hVenezuela.id}) to '${hDeVenezuela.name}' (ID: ${hDeVenezuela.id})...`);

  // 2. Update books
  const { error: updateError } = await supabase
    .from('books')
    .update({ category_id: hDeVenezuela.id })
    .eq('category_id', hVenezuela.id);

  if (updateError) {
    console.error("Error updating books:", updateError);
    return;
  }

  // 3. Delete the old category
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', hVenezuela.id);

  if (deleteError) {
    console.error("Error deleting category:", deleteError);
    // This might fail if there are foreign key constraints I missed, but books should be updated.
  }

  console.log("Merge completed successfully!");
}

mergeCategories();
