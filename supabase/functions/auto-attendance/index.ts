import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const today = now.toISOString().split("T")[0];

    console.log(`[Auto-Attendance] Running at ${now.toISOString()}, time: ${currentTime}`);

    // ===== AUTO CHECK-IN =====
    const { data: dueForCheckIn, error: checkInError } = await supabaseClient
      .from("shift_assignments")
      .select(`
        id,
        promoter_id,
        shift_id,
        scheduled_start_time,
        shifts!inner(date, end_date, status)
      `)
      .eq("auto_checkin_enabled", true)
      .eq("shifts.status", "ongoing")
      .lte("shifts.date", today)
      .or(`end_date.is.null,end_date.gte.${today}`, { foreignTable: "shifts" })
      .eq("scheduled_start_time", currentTime);

    if (checkInError) {
      console.error("[Auto-Attendance] Error fetching check-in assignments:", checkInError);
    } else {
      console.log(`[Auto-Attendance] Found ${dueForCheckIn?.length || 0} assignments for auto check-in`);

      for (const assignment of dueForCheckIn || []) {
        // Check if already checked in
        const { data: existingLog } = await supabaseClient
          .from("time_logs")
          .select("id")
          .eq("user_id", assignment.promoter_id)
          .eq("shift_id", assignment.shift_id)
          .is("check_out_time", null)
          .maybeSingle();

        if (!existingLog) {
          const { error: insertError } = await supabaseClient
            .from("time_logs")
            .insert({
              user_id: assignment.promoter_id,
              shift_id: assignment.shift_id,
              check_in_time: now.toISOString(),
            });

          if (insertError) {
            console.error(`[Auto-Attendance] Failed to check in ${assignment.promoter_id}:`, insertError);
          } else {
            console.log(`[Auto-Attendance] ✓ Auto checked in: ${assignment.promoter_id}`);
          }
        } else {
          console.log(`[Auto-Attendance] Already checked in: ${assignment.promoter_id}`);
        }
      }
    }

    // ===== AUTO CHECK-OUT =====
    const { data: dueForCheckOut, error: checkOutError } = await supabaseClient
      .from("shift_assignments")
      .select(`
        id,
        promoter_id,
        shift_id,
        scheduled_end_time,
        shifts!inner(date, pay_rate, pay_rate_type, status)
      `)
      .eq("auto_checkout_enabled", true)
      .eq("shifts.status", "ongoing")
      .lte("shifts.date", today)
      .eq("scheduled_end_time", currentTime);

    if (checkOutError) {
      console.error("[Auto-Attendance] Error fetching check-out assignments:", checkOutError);
    } else {
      console.log(`[Auto-Attendance] Found ${dueForCheckOut?.length || 0} assignments for auto check-out`);

      for (const assignment of dueForCheckOut || []) {
        // Find active time log
        const { data: activeLog } = await supabaseClient
          .from("time_logs")
          .select("*")
          .eq("user_id", assignment.promoter_id)
          .eq("shift_id", assignment.shift_id)
          .is("check_out_time", null)
          .maybeSingle();

        if (activeLog) {
          const checkInTime = new Date(activeLog.check_in_time);
          const hours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

          // Calculate earnings based on pay rate type
          let earnings = 0;
          const payRate = assignment.shifts.pay_rate;
          const payRateType = assignment.shifts.pay_rate_type;

          switch (payRateType) {
            case "hourly":
              earnings = hours * payRate;
              break;
            case "daily":
              earnings = (hours / 8) * payRate;
              break;
            case "monthly":
              earnings = (hours / 160) * payRate;
              break;
            case "fixed":
              earnings = payRate;
              break;
            default:
              earnings = hours * payRate;
          }

          const { error: updateError } = await supabaseClient
            .from("time_logs")
            .update({
              check_out_time: now.toISOString(),
              total_hours: hours,
              earnings: earnings,
            })
            .eq("id", activeLog.id);

          if (updateError) {
            console.error(`[Auto-Attendance] Failed to check out ${assignment.promoter_id}:`, updateError);
          } else {
            console.log(
              `[Auto-Attendance] ✓ Auto checked out: ${assignment.promoter_id}, ${hours.toFixed(2)}h, BHD ${earnings.toFixed(3)}`
            );
          }
        } else {
          console.log(`[Auto-Attendance] No active time log for: ${assignment.promoter_id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        checkedIn: dueForCheckIn?.length || 0,
        checkedOut: dueForCheckOut?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Auto-Attendance] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
