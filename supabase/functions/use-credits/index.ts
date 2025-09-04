import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    const { certificateId, creditsRequired = 25 } = await req.json();

    // Check if user has enough credits
    const { data: userCredits } = await supabaseClient
      .from("user_credits")
      .select("credits_balance")
      .eq("user_id", user.id)
      .single();

    const currentBalance = userCredits?.credits_balance || 0;
    
    if (currentBalance < creditsRequired) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Insufficient credits",
        required: creditsRequired,
        available: currentBalance
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Deduct credits using the database function
    const { data: deductResult, error: deductError } = await supabaseClient
      .rpc('deduct_user_credits', {
        p_user_id: user.id,
        p_amount: creditsRequired,
        p_description: `Certificate download - ${certificateId}`,
        p_reference_id: certificateId
      });

    if (deductError || !deductResult) {
      throw new Error("Failed to deduct credits");
    }

    return new Response(JSON.stringify({ 
      success: true,
      creditsDeducted: creditsRequired,
      remainingBalance: currentBalance - creditsRequired
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});