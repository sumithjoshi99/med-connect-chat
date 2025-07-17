import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://wfhslrzkjgyrxwxlyjyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaHNscnpramd5cnh3eGx5anl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc1MjQ1OCwiZXhwIjoyMDUwMzI4NDU4fQ.qnDgL4J7gJYrFGW4PqzNKXaYzXXjKP8J0ZZDmLqXEfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying migration to add is_read column...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250627000000_add_is_read_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Apply migration
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column was added
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'messages')
      .eq('column_name', 'is_read');
    
    if (columnError) {
      console.error('❌ Failed to verify column:', columnError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ is_read column verified to exist!');
    } else {
      console.log('❌ is_read column not found after migration');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

// Run the migration
applyMigration(); 