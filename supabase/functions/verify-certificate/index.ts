import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface VerifyCertificateRequest {
  certificate_uid: string
  ip_address?: string
  user_agent?: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const body: VerifyCertificateRequest = await req.json()
    const { certificate_uid, ip_address, user_agent } = body

    if (!certificate_uid) {
      throw new Error('Missing required field: certificate_uid')
    }

    // Clean and validate certificate UID format
    const cleanUid = certificate_uid.trim().toUpperCase()
    if (!cleanUid.match(/^CERT-\d+-[A-Z0-9]+$/)) {
      // Don't reveal the exact format to prevent enumeration
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid certificate ID format' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch certificate (using public RLS policy)
    const { data: certificate, error: fetchError } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_uid,
        user_id,
        tenant_id,
        period_start,
        period_end,
        total_hours,
        total_earnings,
        status,
        is_revoked,
        created_at,
        verification_logs,
        user:profiles!user_id(full_name, nationality),
        tenant:tenants!tenant_id(name)
      `)
      .eq('certificate_uid', cleanUid)
      .single()

    let certificateExists = true
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        certificateExists = false
      } else {
        throw new Error('Database query failed')
      }
    }

    // Log the verification attempt (regardless of whether certificate exists)
    const verificationRecord = {
      timestamp: new Date().toISOString(),
      ip_address: ip_address || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: user_agent || req.headers.get('user-agent') || 'unknown',
      result: certificateExists ? 'found' : 'not_found',
      certificate_uid: cleanUid,
    }

    if (certificateExists && certificate) {
      // Update verification logs in the certificate record
      const currentLogs = certificate.verification_logs || []
      const updatedLogs = [verificationRecord, ...currentLogs.slice(0, 99)] // Keep last 100 verification attempts

      await supabase
        .from('certificates')
        .update({
          verification_logs: updatedLogs,
          updated_at: new Date().toISOString(),
        })
        .eq('certificate_uid', cleanUid)

      // Also log in audit_logs table
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: certificate.tenant_id,
          user_id: null, // Public verification
          action: 'verify',
          resource_type: 'certificate',
          resource_id: certificate.id,
          new_values: verificationRecord,
          ip_address: verificationRecord.ip_address,
          user_agent: verificationRecord.user_agent,
        })
    } else {
      // Log failed verification attempt in audit_logs
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: null,
          user_id: null,
          action: 'verify',
          resource_type: 'certificate',
          resource_id: null,
          new_values: {
            ...verificationRecord,
            error: 'certificate_not_found',
          },
          ip_address: verificationRecord.ip_address,
          user_agent: verificationRecord.user_agent,
        })
    }

    // Return result
    if (!certificateExists) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificate not found',
          verified: false,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Determine if certificate is valid
    const isValid = certificate.status === 'approved' && !certificate.is_revoked
    
    return new Response(
      JSON.stringify({
        success: true,
        verified: isValid,
        certificate: {
          id: certificate.certificate_uid,
          holder_name: certificate.user?.full_name || 'Unknown',
          organization: certificate.tenant?.name || 'Unknown',
          period_start: certificate.period_start,
          period_end: certificate.period_end,
          total_hours: certificate.total_hours,
          total_earnings: certificate.total_earnings,
          issued_date: certificate.created_at,
          status: certificate.status,
          is_revoked: certificate.is_revoked,
          verification_count: (certificate.verification_logs?.length || 0) + 1,
        },
        verification_id: verificationRecord.timestamp,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in certificate verification:', error)
    
    // Log the error attempt
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: null,
          user_id: null,
          action: 'verify',
          resource_type: 'certificate',
          resource_id: null,
          new_values: {
            error: error instanceof Error ? error.message : 'Unknown error',
            certificate_uid: (await req.clone().json())?.certificate_uid || 'unknown',
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message,
        code: 'VERIFICATION_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})