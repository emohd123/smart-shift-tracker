import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Create Promoter
    const promoterEmail = 'promoter@test.com';
    const promoterPassword = 'password123';
    const { data: promoterData, error: promoterError } = await supabase.auth.signUp({
        email: promoterEmail,
        password: promoterPassword,
        options: { data: { full_name: 'Seed Promoter', role: 'promoter' } },
    });

    if (promoterError) console.log('Promoter status:', promoterError.message);
    else {
        console.log('✅ Created/Found Promoter:', promoterEmail);
        if (promoterData.user) {
            // Manually insert profile if trigger failed
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: promoterData.user.id,
                full_name: 'Seed Promoter',
                role: 'promoter',
                email: promoterEmail
            });
            if (profileError) console.log('Promoter profile insert error (might be RLS or already exists):', profileError.message);
            else console.log('✅ Upserted Promoter Profile');
        }
    }

    // 2. Create Company
    const companyEmail = 'company@test.com';
    const companyPassword = 'password123';
    const { data: companyData, error: companyError } = await supabase.auth.signUp({
        email: companyEmail,
        password: companyPassword,
        options: { data: { full_name: 'Seed Company', role: 'company' } },
    });

    if (companyError) {
        console.log('Company status:', companyError.message);
    } else {
        console.log('✅ Created/Found Company:', companyEmail);
        if (companyData.user) {
            // Manually insert profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: companyData.user.id,
                full_name: 'Seed Company',
                role: 'company',
                email: companyEmail
            });
            if (profileError) console.log('Company profile insert error:', profileError.message);
            else console.log('✅ Upserted Company Profile');
        }

        // 3. Create Shift (as Company)
        if (companyData.user && companyData.session) {
            // Use session to auth
            const companyClient = createClient(supabaseUrl, supabaseKey, {
                global: { headers: { Authorization: `Bearer ${companyData.session.access_token}` } }
            });

            const { error: shiftError } = await companyClient.from('shifts').insert({
                title: 'Seed Shift',
                date: new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '17:00',
                location: 'Main HQ',
                pay_rate: 10,
                pay_rate_type: 'hourly',
                status: 'upcoming'
            });

            if (shiftError) console.error('Error creating shift:', shiftError.message);
            else console.log('✅ Created Shift for Company');
        }
    }
}

console.log('✅ Seed complete.');


seed().catch(console.error);
