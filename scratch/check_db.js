const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = '';
let supabaseKey = '';

try {
  const env = fs.readFileSync('.env.local', 'utf8');
  const lines = env.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error('Error reading env:', e);
}

if (!supabaseUrl) supabaseUrl = 'https://dacrantazuleoohnnzoz.supabase.co';
if (!supabaseKey) supabaseKey = 'sb_publishable_IzJg-PRYO5vHEu5ML-bajA_eD2nxQq7';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles columns:', data.length > 0 ? Object.keys(data[0]) : 'No rows');
  }
}

run();
