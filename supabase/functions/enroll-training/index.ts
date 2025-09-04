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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { moduleId } = await req.json();

    // Get module details
    const { data: module, error: moduleError } = await supabaseClient
      .from('training_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      throw new Error("Training module not found");
    }

    // Check if user has sufficient credits (if module costs credits)
    if (module.price_credits > 0) {
      const { data: userCredits } = await supabaseClient
        .from('user_credits')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      const balance = userCredits?.credits_balance || 0;
      if (balance < module.price_credits) {
        return new Response(JSON.stringify({ 
          error: "Insufficient credits",
          required: module.price_credits,
          current: balance
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Deduct credits
      const { error: deductError } = await supabaseClient.rpc('deduct_user_credits', {
        p_user_id: user.id,
        p_amount: module.price_credits,
        p_description: `Training module: ${module.title}`,
        p_reference_id: moduleId
      });

      if (deductError) {
        throw new Error("Failed to deduct credits");
      }
    }

    // Enroll user in module
    const { error: enrollError } = await supabaseClient
      .from('user_module_progress')
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        progress_percentage: 0,
        started_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      });

    if (enrollError) {
      throw new Error("Failed to enroll in module");
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Successfully enrolled in training module",
      module: module
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