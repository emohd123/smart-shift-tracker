import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating code for user:', user.id);

    // Check if user already has a code
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('unique_code')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch profile');
    }

    if (profile.unique_code) {
      console.log('User already has code:', profile.unique_code);
      return new Response(
        JSON.stringify({ 
          success: true, 
          code: profile.unique_code,
          message: 'Code already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique code
    const code = await generateUniqueCode(supabaseClient);
    console.log('Generated code:', code);

    // Update profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ unique_code: code })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update profile');
    }

    console.log('Successfully updated profile with code');

    return new Response(
      JSON.stringify({ 
        success: true, 
        code,
        message: 'Code generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-unique-code:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to generate unique code
async function generateUniqueCode(supabase: any): Promise<string> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = 'PROMO-';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code exists
    const { data } = await supabase
      .from('profiles')
      .select('unique_code')
      .eq('unique_code', code)
      .maybeSingle();

    if (!data) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique code after 10 attempts');
}
