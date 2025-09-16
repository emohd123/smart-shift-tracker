import 'dotenv/config';
import fetch from 'node-fetch';

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

async function fetchOpenAPI(token) {
  const res = await fetch(`${url}/rest/v1/`, {
    method: 'GET',
    headers: {
      Accept: 'application/openapi+json',
      apikey: token,
      Authorization: `Bearer ${token}`,
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', res.status, res.statusText, text.slice(0, 200));
    return null;
  }
  return json;
}

function listTablesFromOpenAPI(doc) {
  if (!doc || !doc.components || !doc.components.schemas) return [];
  const schemas = doc.components.schemas;
  // PostgREST includes tables as schemas with x-db-schema and x-db-table
  const tables = Object.values(schemas)
    .filter((s) => s && typeof s === 'object' && 'x-db-table' in s)
    .map((s) => `${s['x-db-schema']}.${s['x-db-table']}`)
    .sort();
  return [...new Set(tables)];
}

async function main() {
  console.log('🔎 Fetching PostgREST OpenAPI with anon key...');
  let openapi = await fetchOpenAPI(anon);
  if (!openapi && svc) {
    console.log('Retrying with service role key...');
    openapi = await fetchOpenAPI(svc);
  }
  if (!openapi) {
    console.error('❌ Unable to retrieve OpenAPI. Check Data API, keys, or service availability.');
    return;
  }
  const tables = listTablesFromOpenAPI(openapi);
  console.log(`Schemas exposed: ${(openapi.components?.schemas ? Object.keys(openapi.components.schemas).length : 0)} entries`);
  if (tables.length === 0) {
    console.warn('⚠️ No tables detected in OpenAPI. This can mean the schema cache is stale or no tables are exposed.');
  } else {
    console.log('Tables exposed by REST:');
    for (const t of tables) console.log(' -', t);
  }
}

main();
