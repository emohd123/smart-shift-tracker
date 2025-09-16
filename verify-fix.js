import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyFix() {
  console.log('🔍 Verifying database fix...');
  
  try {
    // Test the enhanced query that was failing before
    const { data: promoters, error: promotersError } = await supabase
      .from('profiles')
      .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
      .in('role', ['part_timer', 'promoter'])
      .eq('verification_status', 'approved');
    
    if (promotersError) {
      console.error('❌ Enhanced query still failing:', promotersError);
      
      // Check if columns exist
      const { data: basicTest, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (basicError) {
        console.error('❌ Basic query also failed:', basicError);
      } else {
        console.log('📋 Current table columns:', Object.keys(basicTest[0] || {}));
        
        if (!Object.keys(basicTest[0] || {}).includes('unique_code')) {
          console.log('❌ unique_code column still missing!');
          console.log('   Please run the SQL from the previous step.');
        }
      }
      return;
    }
    
    console.log('✅ Enhanced query succeeded!');
    console.log(`📈 Found ${promoters.length} approved promoters:`);
    
    if (promoters.length === 0) {
      console.log('⚠️ No approved promoters found.');
      
      // Check all promoters regardless of status
      const { data: allPromoters } = await supabase
        .from('profiles')
        .select('full_name, unique_code, role, verification_status')
        .in('role', ['part_timer', 'promoter']);
      
      console.log('📋 All promoter profiles:', allPromoters);
    } else {
      promoters.forEach(p => {
        console.log(`  ✅ ${p.full_name} (${p.unique_code}) - ${p.age} years • ${p.nationality}`);
      });
      
      console.log('');
      console.log('🎉 DATABASE FIX SUCCESSFUL!');
      console.log('');
      console.log('💡 Now test the frontend:');
      console.log('   1. Go to http://localhost:8082');
      console.log('   2. Login as: company1@test.com / testpass123');
      console.log('   3. Navigate to shift creation');
      console.log('   4. Open promoter assignment dropdown');
      console.log('   5. You should see the promoters with unique codes!');
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifyFix();