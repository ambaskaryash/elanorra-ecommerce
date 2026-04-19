const fetch = require('node-fetch'); // If not available, use dynamic import or native fetch
const ADMIN_API = 'https://api.elanorraliving.in/admin';
const TOKEN = 'sk_a12a65750a5c6ad924226968e4eac594c19010f8e0439f756c18217aea0c3930';

async function req(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ADMIN_API}${path}`, opts);
  if (!res.ok) {
     const t = await res.text();
     throw new Error(`Medusa ${method} ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function run() {
  try {
    console.log('1. Checking connection...');
    const auth = await req('/users/me');
    console.log('Logged in as:', auth.user.email);
    
    console.log('\n2. Fetching Regions...');
    const { regions } = await req('/regions');
    console.log('Found Regions:', regions.map(r => r.name));
    
  } catch (e) {
    console.error(e.message);
  }
}
run();
