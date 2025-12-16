import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function check() {
    const { data: users, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles count:', users.length);
        console.log('Profiles:', JSON.stringify(users, null, 2));
    }
}

check();
