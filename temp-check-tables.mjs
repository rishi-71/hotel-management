import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gxvqdzjbwmoybdduwzre.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dnFkempid21veWJkZHV3enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NzE4MzksImV4cCI6MjEwMDQ0NzgzOX0.0gfCLhlxxfmkE5Iqns8Vr0B1ligdsaSJwFdz1M7kj5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMoreTables() {
  const possibleTables = ['admin_users', 'admin', 'user_role', 'roles', 'user_metadata', 'settings', 'config'];
  for (const table of possibleTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": Error - ${error.message}`);
    } else {
      console.log(`Table "${table}": EXISTS! Columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    }
  }
}

checkMoreTables();
