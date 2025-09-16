import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATION_PATH = path.join('supabase', 'migrations', '20250909120000_update_is_company_roles.sql');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

async function execSql(sql) {
  // Try the REST "query" endpoint first (some projects expose it),
  // otherwise fall back to the RPC exec_sql endpoint used elsewhere in the repo.
  const base = SUPABASE_URL.replace(/\/$/, '');

  // First attempt: /rest/v1/query
  try {
    const url = `${base}/rest/v1/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    const text = await res.text();
    if (res.ok) return { ok: true, status: res.status, text };
    // If 404 or not ok, fall through to RPC attempt
    console.log('Query endpoint returned', res.status, '- falling back to RPC');
  } catch (e) {
    console.log('Query endpoint failed, will try RPC:', e.message || e);
  }

  // Fallback: /rest/v1/rpc/exec_sql (body uses `sql` key)
  try {
    const rpcUrl = `${base}/rest/v1/rpc/exec_sql`;
    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({ sql })
    });

    const rpcText = await rpcRes.text();
    return { ok: rpcRes.ok, status: rpcRes.status, text: rpcText };
  } catch (err) {
    return { ok: false, status: 0, text: String(err) };
  }
}

async function insertShift(payload) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/shifts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      Prefer: 'return=representation'
    },
    body: JSON.stringify([payload])
  });

  const json = await res.text();
  return { ok: res.ok, status: res.status, text: json };
}

(async () => {
  try {
    console.log('Reading migration:', MIGRATION_PATH);
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

    console.log('Applying migration to', SUPABASE_URL);
    const apply = await execSql(sql);
    if (!apply.ok) {
      console.error('Migration failed:', apply.status, apply.text);
      process.exit(2);
    }
    console.log('Migration applied successfully');

    console.log('Running smoke test: inserting a test shift with service role');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const shiftPayload = {
      date: dateStr,
      start_time: '09:00:00',
      end_time: '17:00:00',
      // employer_id omitted to avoid FK constraints; service key bypasses RLS
    };

    const insert = await insertShift(shiftPayload);
    if (!insert.ok) {
      console.error('Shift insert failed:', insert.status, insert.text);
      process.exit(3);
    }

    console.log('Shift insert succeeded:', insert.text);
    console.log('\n✅ Migration + smoke test completed.');
  } catch (err) {
    console.error('Unexpected error:', err.message || err);
    process.exit(99);
  }
})();
