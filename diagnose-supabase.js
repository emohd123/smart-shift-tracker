import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function red(s) {
  return `\x1b[31m${s}\x1b[0m`;
}
function green(s) {
  return `\x1b[32m${s}\x1b[0m`;
}
function yellow(s) {
  return `\x1b[33m${s}\x1b[0m`;
}

function summarizeKey(key) {
  if (!key) return '(missing)';
  return `${key.slice(0, 8)}...${key.slice(-6)}`;
}

async function checkAuthHealth() {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function trySelect(client, table) {
  try {
    const { error } = await client.from(table).select('*').limit(1);
    return error ? { ok: false, error } : { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function diagnose() {
  console.log('🔍 Diagnosing SmartSheetshift Supabase project...');

  if (!SUPABASE_URL) {
    console.error(red('❌ VITE_SUPABASE_URL not set in .env'));
    return;
  }
  if (!SUPABASE_ANON_KEY) {
    console.error(red('❌ VITE_SUPABASE_ANON_KEY not set in .env'));
    return;
  }

  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
  console.log(`Project: ${green(projectRef)}`);
  console.log(`Anon key: ${yellow(summarizeKey(SUPABASE_ANON_KEY))}`);
  console.log(`Service key: ${yellow(summarizeKey(SUPABASE_SERVICE_ROLE_KEY))}`);

  // 0. Basic reachability check for auth endpoint (does not require API key)
  const authHealthy = await checkAuthHealth();
  console.log(authHealthy ? green('✅ Auth service reachable') : red('❌ Auth service not reachable'));

  // 1. Create clients
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const svc = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

  // 2. Quick API key sanity check using a lightweight select
  const anonCheck = await trySelect(anon, 'profiles');
  if (!anonCheck.ok && anonCheck.error?.message?.toLowerCase().includes('invalid api key')) {
    console.error(red('❌ Invalid API key (anon). Please copy the current Anon public key from Supabase Settings > API'));
    return;
  }

  if (svc) {
    const svcCheck = await trySelect(svc, 'profiles');
    if (!svcCheck.ok && svcCheck.error?.message?.toLowerCase().includes('invalid api key')) {
      console.error(red('❌ Invalid API key (service role). Please copy the current Service role key from Supabase Settings > API'));
      return;
    }
  }

  // 3. Check for required tables with service role (bypasses RLS if available)
  const client = svc ?? anon;
  const requiredTables = ['tenants', 'tenant_memberships', 'profiles'];
  for (const table of requiredTables) {
    const res = await trySelect(client, table);
    if (!res.ok) {
      console.error(`❌ Table missing or inaccessible: ${table} (${res.error?.message ?? res.error})`);
    } else {
      console.log(`✅ Table exists and accessible: ${table}`);
    }
  }

  // 4. Test RLS for tenants with anon key only (expected to fail if policy too strict)
  const testTenant = {
    name: `Test ${Date.now()}`,
    slug: `test-${Date.now()}`,
    subscription_tier: 'starter',
    subscription_status: 'active',
    max_users: 1,
    settings: {}
  };
  const { error: insertAnonErr } = await anon.from('tenants').insert(testTenant);
  if (insertAnonErr) {
    if (insertAnonErr.message.toLowerCase().includes('row level security')) {
      console.error(yellow('⚠️ RLS is blocking anon insert on tenants (expected if not signed in)'));
    } else if (insertAnonErr.message.toLowerCase().includes('permission denied')) {
      console.error(yellow('⚠️ Permission denied for anon on tenants (likely RLS/policy)'));
    } else {
      console.error(`❌ Anon insert error on tenants: ${insertAnonErr.message}`);
    }
  } else {
    console.log(green('✅ Anon insert succeeded on tenants (RLS allows it)'));
  }

  // 5. Service role insert should succeed if key is valid
  if (svc) {
    const { error: insertSvcErr } = await svc.from('tenants').insert({ ...testTenant, slug: `svc-${Date.now()}` });
    if (insertSvcErr) {
      console.error(red(`❌ Service role insert failed on tenants: ${insertSvcErr.message}`));
    } else {
      console.log(green('✅ Service role insert succeeded on tenants (bypasses RLS)'));
    }
  }
}

diagnose();
