
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

console.log("Hello from Functions!");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email constant - THIS EMAIL ONLY
const ADMIN_EMAIL = "emohd123@gmail.com";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if admin already exists
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      throw searchError;
    }
    
    const adminExists = existingUsers.users.some(user => user.email === ADMIN_EMAIL);
    
    if (adminExists) {
      console.log("Admin user already exists");
      return new Response(
        JSON.stringify({ message: "Admin user already exists", adminCreated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the admin user with the hardcoded email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: "password123",
      email_confirm: true,
      user_metadata: { name: "Admin User" },
    });

    if (error) {
      throw error;
    }

    console.log("Admin user created:", data);

    // Update the profile table to set the role as admin
    if (data.user) {
      // First check if the profile exists
      const { data: profileData, error: profileQueryError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileQueryError && profileQueryError.message !== "No rows found") {
        console.error("Error checking for profile:", profileQueryError);
      }

      if (!profileData) {
        // Profile doesn't exist, create it with the admin role
        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: data.user.id,
            full_name: "Admin User",
            nationality: "United States",
            age: 30,
            phone_number: "+1234567890",
            gender: "Male",
            height: 175,
            weight: 70,
            is_student: false,
            address: "Admin Address",
            role: "admin",
            verification_status: "approved"
          });

        if (insertError) {
          console.error("Error creating admin profile:", insertError);
        }
      } else {
        // Profile exists, update it to admin role
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ role: "admin", verification_status: "approved" })
          .eq("id", data.user.id);

        if (updateError) {
          console.error("Error updating admin profile:", updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Admin user created successfully", adminCreated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating admin user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
