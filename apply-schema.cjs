const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use service role key for admin access
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchemaChanges() {
  try {
    console.log('🚀 Applying Enhanced Profile Schema and Triggers...\n');

    // Read SQL files
    const enhancedProfilesSQL = fs.readFileSync(
      path.join(__dirname, 'supabase', 'ENHANCED_PROFILES_SCHEMA.sql'), 
      'utf8'
    );
    
    const profileTriggerSQL = fs.readFileSync(
      path.join(__dirname, 'supabase', 'PROFILE_CREATION_TRIGGER.sql'), 
      'utf8'
    );

    console.log('📋 Step 1: Applying Enhanced Profiles Schema...');
    const { data: schemaResult, error: schemaError } = await supabase.rpc('exec', {
      sql: enhancedProfilesSQL
    });

    if (schemaError) {
      console.log('❌ Schema Error:', schemaError.message);
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying direct SQL execution...');
      
      // Split SQL into individual statements and execute them
      const statements = enhancedProfilesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.toLowerCase().includes('alter table') || 
            statement.toLowerCase().includes('create')) {
          try {
            console.log(`  Executing statement ${i + 1}/${statements.length}...`);
            const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' });
            if (stmtError && !stmtError.message.includes('already exists')) {
              console.log(`    ⚠️ Warning: ${stmtError.message}`);
            } else {
              console.log(`    ✅ Success`);
            }
          } catch (err) {
            console.log(`    ⚠️ Error: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Enhanced Profiles Schema applied successfully!');
    }

    console.log('\n📋 Step 2: Applying Profile Creation Trigger...');
    const { data: triggerResult, error: triggerError } = await supabase.rpc('exec', {
      sql: profileTriggerSQL
    });

    if (triggerError) {
      console.log('❌ Trigger Error:', triggerError.message);
      console.log('🔄 Trying to apply trigger manually...');
      
      // Try to create the key components manually
      const keyStatements = [
        `CREATE OR REPLACE FUNCTION public.generate_unique_user_code()
         RETURNS TEXT AS $$ 
         DECLARE new_code TEXT; code_exists BOOLEAN;
         BEGIN
           LOOP
             new_code := 'USR' || UPPER(substr(md5(random()::text), 1, 5));
             SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_code = new_code) INTO code_exists;
             IF NOT code_exists THEN RETURN new_code; END IF;
           END LOOP;
         END; $$ LANGUAGE plpgsql SECURITY DEFINER`,
        
        `CREATE OR REPLACE FUNCTION public.handle_new_user()
         RETURNS TRIGGER AS $$
         BEGIN
           INSERT INTO public.profiles (id, tenant_id, email, full_name, role, unique_code, created_at, updated_at)
           VALUES (NEW.id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
                   COALESCE(NEW.raw_user_meta_data->>'role', 'part_timer'), public.generate_unique_user_code(), NOW(), NOW())
           ON CONFLICT (id) DO NOTHING;
           RETURN NEW;
         EXCEPTION WHEN OTHERS THEN
           RAISE WARNING 'Error creating profile: %', SQLERRM;
           RETURN NEW;
         END; $$ LANGUAGE plpgsql SECURITY DEFINER`,
           
        `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
        `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`
      ];

      for (let i = 0; i < keyStatements.length; i++) {
        try {
          console.log(`  Creating component ${i + 1}/${keyStatements.length}...`);
          const { error } = await supabase.rpc('exec', { sql: keyStatements[i] });
          if (error) {
            console.log(`    ⚠️ ${error.message}`);
          } else {
            console.log(`    ✅ Success`);
          }
        } catch (err) {
          console.log(`    ⚠️ ${err.message}`);
        }
      }
    } else {
      console.log('✅ Profile Creation Trigger applied successfully!');
    }

    console.log('\n📋 Step 3: Creating profiles for existing users...');
    
    // Backfill existing users
    try {
      const { data: backfillResult, error: backfillError } = await supabase.rpc('backfill_missing_profiles');
      
      if (backfillError) {
        console.log('❌ Backfill Error:', backfillError.message);
        console.log('🔄 Trying manual backfill...');
        
        // Manual backfill for existing auth users
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (!usersError && users) {
          console.log(`Found ${users.length} auth users, creating profiles...`);
          
          for (const user of users) {
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                tenant_id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                role: user.user_metadata?.role || user.app_metadata?.role || 'part_timer',
                unique_code: 'USR' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                nationality: user.user_metadata?.nationality || '',
                age: user.user_metadata?.age || null,
                phone_number: user.user_metadata?.phone_number || user.user_metadata?.phone || '',
                gender: user.user_metadata?.gender || 'Male',
                height: user.user_metadata?.height || null,
                weight: user.user_metadata?.weight || null,
                is_student: user.user_metadata?.is_student || false,
                address: user.user_metadata?.address || '',
                bank_details: user.user_metadata?.bank_details || '',
                verification_status: 'pending',
                created_at: user.created_at,
                updated_at: new Date().toISOString()
              }, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });
              
            if (insertError) {
              console.log(`  ⚠️ Error creating profile for ${user.email}: ${insertError.message}`);
            } else {
              console.log(`  ✅ Profile created for ${user.email}`);
            }
          }
        }
      } else {
        console.log(`✅ ${backfillResult || 0} profiles created for existing users!`);
      }
    } catch (backfillErr) {
      console.log('⚠️ Backfill process had issues:', backfillErr.message);
    }

    console.log('\n📊 Step 4: Verifying the changes...');
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, unique_code, full_name')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('❌ Verification Error:', profilesError.message);
    } else {
      console.log(`✅ Profiles table now has ${profiles.length} records:`);
      profiles.forEach((profile, index) => {
        const roleEmoji = profile.role === 'part_timer' ? '👨‍💼' : profile.role === 'company' ? '🏢' : profile.role === 'super_admin' ? '👑' : '❓';
        console.log(`  ${index + 1}. ${profile.email} - ${roleEmoji} ${profile.role} - Code: ${profile.unique_code}`);
      });
    }

    console.log('\n🎉 Schema application complete!');
    console.log('📋 Next steps:');
    console.log('  1. Test the signup flow');
    console.log('  2. Verify part-timer dashboard works');
    console.log('  3. Check unique code generation');

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

applySchemaChanges();
