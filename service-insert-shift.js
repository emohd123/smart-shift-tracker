import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

async function insertShift() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/shifts`;
  const payload = {
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00:00',
    end_time: '17:00:00',
    location: 'Test Location',
    title: 'Smoke Test Shift',
    status: 'published'
  };

  try {
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

    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
    if (!res.ok) process.exit(2);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting shift:', err.message || err);
    process.exit(3);
  }
}

insertShift();
