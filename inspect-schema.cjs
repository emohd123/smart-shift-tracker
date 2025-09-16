const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function inspectSchema() {
  try {
    console.log('🔍 Inspecting current database schema...\n');

    // Check if tenants table exists
    console.log('📋 Checking tenants table...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(5);

    if (tenantsError) {
      console.log('❌ Tenants table error:', tenantsError.message);
    } else {
      console.log(`✅ Tenants table exists with ${tenants.length} records`);
      if (tenants.length > 0) {
        console.log('Sample tenant:', tenants[0]);
      }
    }

    // Check profiles table structure by trying to insert with minimal data
    console.log('\n📋 Testing minimal profile creation...');
    const testUserId = 'test-user-id-' + Date.now();
    
    // First, create a tenant if needed
    if (!tenantsError && tenants.length === 0) {
      console.log('Creating test tenant...');
      const { error: tenantCreateError } = await supabase
        .from('tenants')
        .insert({
          id: testUserId,
          name: 'Test Tenant',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (tenantCreateError) {
        console.log('❌ Tenant creation error:', tenantCreateError.message);
      } else {
        console.log('✅ Test tenant created');
      }
    }

    // Try creating profile with minimal data
    console.log('Testing profile creation...');
    const { error: profileTestError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        tenant_id: tenants.length > 0 ? tenants[0].id : testUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'part_timer'
      });

    if (profileTestError) {
      console.log('❌ Profile creation test error:', profileTestError.message);
      
      // Try without tenant_id
      console.log('Trying without tenant_id...');
      const { error: profileTestError2 } = await supabase
        .from('profiles')
        .insert({
          id: testUserId + '2',
          email: 'test2@example.com',
          full_name: 'Test User 2',
          role: 'part_timer'
        });
        
      if (profileTestError2) {
        console.log('❌ Still failing:', profileTestError2.message);
      } else {
        console.log('✅ Works without tenant_id');
      }
    } else {
      console.log('✅ Profile creation test successful');
    }

    // Clean up test data
    await supabase.from('profiles').delete().eq('id', testUserId);
    await supabase.from('profiles').delete().eq('id', testUserId + '2');
    await supabase.from('tenants').delete().eq('id', testUserId);

    // Now try to create real user profiles
    console.log('\n📋 Creating profiles for real users...');
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Error getting users:', usersError.message);
      return;
    }

    // Get existing tenant or create one for each user
    for (const user of users) {
      console.log(`\nProcessing ${user.email}...`);
      
      // Try to find existing tenant or create one
      let tenantId = null;
      
      if (!tenantsError) {
        // Check if tenant exists for this user
        const { data: userTenant, error: tenantFindError } = await supabase
          .from('tenants')
          .select('id')
          .eq('id', user.id)
          .single();

        if (tenantFindError && tenantFindError.code !== 'PGRST116') {
          console.log(`  ⚠️ Tenant lookup error: ${tenantFindError.message}`);
        }

        if (!userTenant) {
          // Create tenant for user
          const { data: newTenant, error: tenantCreateError } = await supabase
            .from('tenants')
            .insert({
              id: user.id,
              name: user.email.split('@')[0] + ' Organization',
              created_at: user.created_at,
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (tenantCreateError) {
            console.log(`  ⚠️ Tenant creation error: ${tenantCreateError.message}`);
            // Try without tenant relationship
            tenantId = null;
          } else {
            tenantId = newTenant.id;
            console.log(`  ✅ Tenant created: ${tenantId}`);
          }
        } else {
          tenantId = userTenant.id;
          console.log(`  ✅ Using existing tenant: ${tenantId}`);
        }
      }

      // Create profile
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
        role: user.user_metadata?.role || user.app_metadata?.role || 'part_timer',
        verification_status: 'pending',
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };

      // Only add tenant_id if we have one
      if (tenantId) {
        profileData.tenant_id = tenantId;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.log(`  ❌ Profile error: ${profileError.message}`);
      } else {
        console.log(`  ✅ Profile created/updated for ${user.email}`);
      }
    }

    // Final verification
    console.log('\n📊 Final verification...');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, tenant_id')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log('❌ Final verification error:', finalError.message);
    } else {
      console.log(`✅ Final count: ${finalProfiles.length} profiles`);
      finalProfiles.forEach((profile, index) => {
        const roleEmoji = profile.role === 'part_timer' ? '👨‍💼' : profile.role === 'company' ? '🏢' : profile.role === 'company_admin' ? '🏢' : '❓';
        console.log(`  ${index + 1}. ${profile.email} - ${roleEmoji} ${profile.role} (tenant: ${profile.tenant_id ? 'Yes' : 'No'})`);
      });
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

inspectSchema();
