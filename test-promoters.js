// Quick test script to check promoter data in Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eihytvzfayoczbplecbz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_KEY) {
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY not set in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testPromoters() {
  console.log('\n=== Testing Promoter Data ===\n');

  try {
    // 1. Check approved promoters count
    const { data: approvedPromoters, error: countError } = await supabase
      .from('profiles')
      .select('id, full_name, verification_status, role', { count: 'exact' })
      .eq('role', 'promoter')
      .eq('verification_status', 'approved');

    if (countError) {
      console.error('❌ Error fetching approved promoters:', countError);
    } else {
      console.log(`✅ Approved promoters found: ${approvedPromoters?.length || 0}`);
      if (approvedPromoters && approvedPromoters.length > 0) {
        console.log('   Sample:', approvedPromoters.slice(0, 2).map(p => p.full_name).join(', '));
      }
    }

    // 2. Test RPC function
    console.log('\n📞 Testing RPC: list_eligible_promoters()');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('list_eligible_promoters');

    if (rpcError) {
      console.error('❌ RPC error:', rpcError.message);
    } else {
      console.log(`✅ RPC works! Returned ${rpcResult?.length || 0} records`);
      if (rpcResult && rpcResult.length > 0) {
        console.log('   Sample:', rpcResult.slice(0, 2).map(p => p.full_name).join(', '));
      }
    }

    // 3. Check all profiles count
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('role', { count: 'exact' });

    if (!allError) {
      console.log(`\n📊 Total profiles: ${allProfiles?.length || 0}`);
    }

    // 4. Check promoters by verification status
    const { data: byStatus } = await supabase
      .from('profiles')
      .select('verification_status', { count: 'exact' })
      .eq('role', 'promoter');

    if (byStatus) {
      const approved = byStatus.filter(p => p.verification_status === 'approved').length;
      const pending = byStatus.filter(p => p.verification_status === 'pending').length;
      const rejected = byStatus.filter(p => p.verification_status === 'rejected').length;
      
      console.log(`\n📋 Promoter status breakdown:`);
      console.log(`   Approved: ${approved}`);
      console.log(`   Pending: ${pending}`);
      console.log(`   Rejected: ${rejected}`);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  process.exit(0);
}

testPromoters();
