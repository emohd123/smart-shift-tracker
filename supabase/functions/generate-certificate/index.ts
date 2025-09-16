import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface GenerateCertificateRequest {
  certificate_request_id: string
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
    const body: GenerateCertificateRequest = await req.json()
    const { certificate_request_id } = body

    if (!certificate_request_id) {
      throw new Error('Missing required field: certificate_request_id')
    }

    // Fetch certificate request with all needed data
    const { data: certRequest, error: fetchError } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        tenant:tenants(name, settings),
        user:profiles!part_timer_id(full_name, email, phone_number, nationality)
      `)
      .eq('id', certificate_request_id)
      .single()

    if (fetchError || !certRequest) {
      throw new Error('Certificate request not found')
    }

    if (certRequest.status !== 'paid' && certRequest.status !== 'processing') {
      throw new Error('Certificate request is not in valid status for generation')
    }

    // Generate unique certificate UID if not exists
    const certificateUid = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    // Create the PDF certificate
    const pdfBytes = await generateCertificatePDF({
      certificateUid,
      userInfo: {
        full_name: certRequest.user?.full_name || 'Unknown User',
        email: certRequest.user?.email || '',
        phone_number: certRequest.user?.phone_number || '',
        nationality: certRequest.user?.nationality || '',
      },
      workInfo: {
        total_hours: certRequest.total_hours || 0,
        total_earnings: certRequest.total_earnings || 0,
        period_start: certRequest.period_start,
        period_end: certRequest.period_end,
        tenant_name: certRequest.tenant?.name || 'Smart Shift Tracker',
      },
      generationDate: new Date().toISOString(),
    })

    // Upload PDF to Supabase Storage
    const fileName = `certificate_${certificateUid}.pdf`
    const filePath = `certificates/${certRequest.tenant_id}/${certRequest.part_timer_id}/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload certificate: ${uploadError.message}`)
    }

    // Get public URL for the PDF
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath)

    const pdfUrl = urlData.publicUrl

    // Create certificate record
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        tenant_id: certRequest.tenant_id,
        user_id: certRequest.part_timer_id,
        certificate_request_id: certificate_request_id,
        certificate_uid: certificateUid,
        period_start: certRequest.period_start,
        period_end: certRequest.period_end,
        total_hours: certRequest.total_hours,
        total_earnings: certRequest.total_earnings,
        pdf_url: pdfUrl,
        status: 'approved',
        generated_by: null, // System generated
        generation_metadata: {
          generated_at: new Date().toISOString(),
          pdf_size_bytes: pdfBytes.length,
          file_path: filePath,
        },
      })
      .select()
      .single()

    if (certError) {
      throw new Error(`Failed to create certificate record: ${certError.message}`)
    }

    // Update certificate request to completed
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificate_request_id)

    if (updateError) {
      console.error('Failed to update certificate request status:', updateError)
      // Don't throw - the certificate was created successfully
    }

    // Log the certificate generation
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: certRequest.tenant_id,
        user_id: certRequest.part_timer_id,
        action: 'create',
        resource_type: 'certificate',
        resource_id: certificate.id,
        new_values: {
          certificate_uid: certificateUid,
          total_hours: certRequest.total_hours,
          period: `${certRequest.period_start} to ${certRequest.period_end}`,
          pdf_url: pdfUrl,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      })

    // Return the certificate details
    return new Response(
      JSON.stringify({
        success: true,
        certificate_id: certificate.id,
        certificate_uid: certificateUid,
        pdf_url: pdfUrl,
        verification_url: `${Deno.env.get('SUPABASE_URL')?.replace('/v1', '') || 'https://app.smartshift.com'}/verify-certificate?uid=${certificateUid}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error generating certificate:', error)
    
    // Try to update certificate request status to failed
    if (req.url.includes('certificate_request_id')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const body = await req.clone().json()
        await supabase
          .from('certificate_requests')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.certificate_request_id)
      } catch (updateError) {
        console.error('Failed to update certificate request to failed status:', updateError)
      }
    }
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message,
        code: 'CERTIFICATE_GENERATION_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateCertificatePDF(data: {
  certificateUid: string
  userInfo: {
    full_name: string
    email: string
    phone_number: string
    nationality: string
  }
  workInfo: {
    total_hours: number
    total_earnings: number
    period_start: string
    period_end: string
    tenant_name: string
  }
  generationDate: string
}): Promise<Uint8Array> {
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter size
  
  // Load fonts
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  // Colors
  const darkBlue = rgb(0.1, 0.2, 0.4)
  const lightBlue = rgb(0.3, 0.5, 0.7)
  const darkGray = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.6, 0.6, 0.6)
  
  // Page dimensions
  const { width, height } = page.getSize()
  const margin = 60
  const contentWidth = width - (margin * 2)
  
  let currentY = height - margin
  
  // Header
  page.drawText('WORK EXPERIENCE CERTIFICATE', {
    x: margin,
    y: currentY,
    size: 24,
    font: titleFont,
    color: darkBlue,
  })
  currentY -= 40
  
  // Certificate ID
  page.drawText(`Certificate ID: ${data.certificateUid}`, {
    x: margin,
    y: currentY,
    size: 10,
    font: smallFont,
    color: lightGray,
  })
  currentY -= 30
  
  // Draw horizontal line
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 2,
    color: lightBlue,
  })
  currentY -= 40
  
  // Certification statement
  const certificationText = 'This is to certify that'
  page.drawText(certificationText, {
    x: margin,
    y: currentY,
    size: 14,
    font: bodyFont,
    color: darkGray,
  })
  currentY -= 30
  
  // User name (highlighted)
  page.drawText(data.userInfo.full_name.toUpperCase(), {
    x: margin,
    y: currentY,
    size: 20,
    font: titleFont,
    color: darkBlue,
  })
  currentY -= 40
  
  // Work details
  const workText = `has successfully completed ${data.workInfo.total_hours} hours of work`
  page.drawText(workText, {
    x: margin,
    y: currentY,
    size: 14,
    font: bodyFont,
    color: darkGray,
  })
  currentY -= 25
  
  const periodText = `during the period from ${formatDate(data.workInfo.period_start)} to ${formatDate(data.workInfo.period_end)}`
  page.drawText(periodText, {
    x: margin,
    y: currentY,
    size: 14,
    font: bodyFont,
    color: darkGray,
  })
  currentY -= 40
  
  // Work summary box
  const boxY = currentY - 100
  page.drawRectangle({
    x: margin,
    y: boxY,
    width: contentWidth,
    height: 80,
    borderColor: lightBlue,
    borderWidth: 1,
    color: rgb(0.95, 0.95, 1),
  })
  
  // Work summary content
  page.drawText('WORK SUMMARY', {
    x: margin + 20,
    y: boxY + 55,
    size: 12,
    font: titleFont,
    color: darkBlue,
  })
  
  page.drawText(`Total Hours Worked: ${data.workInfo.total_hours}`, {
    x: margin + 20,
    y: boxY + 35,
    size: 11,
    font: bodyFont,
    color: darkGray,
  })
  
  if (data.workInfo.total_earnings > 0) {
    page.drawText(`Total Earnings: $${data.workInfo.total_earnings.toFixed(2)}`, {
      x: margin + 20,
      y: boxY + 20,
      size: 11,
      font: bodyFont,
      color: darkGray,
    })
  }
  
  page.drawText(`Organization: ${data.workInfo.tenant_name}`, {
    x: margin + 20,
    y: boxY + 5,
    size: 11,
    font: bodyFont,
    color: darkGray,
  })
  
  currentY = boxY - 40
  
  // User information section
  page.drawText('CERTIFICATE HOLDER INFORMATION', {
    x: margin,
    y: currentY,
    size: 12,
    font: titleFont,
    color: darkBlue,
  })
  currentY -= 25
  
  if (data.userInfo.email) {
    page.drawText(`Email: ${data.userInfo.email}`, {
      x: margin,
      y: currentY,
      size: 10,
      font: bodyFont,
      color: darkGray,
    })
    currentY -= 15
  }
  
  if (data.userInfo.phone_number) {
    page.drawText(`Phone: ${data.userInfo.phone_number}`, {
      x: margin,
      y: currentY,
      size: 10,
      font: bodyFont,
      color: darkGray,
    })
    currentY -= 15
  }
  
  if (data.userInfo.nationality) {
    page.drawText(`Nationality: ${data.userInfo.nationality}`, {
      x: margin,
      y: currentY,
      size: 10,
      font: bodyFont,
      color: darkGray,
    })
    currentY -= 30
  }
  
  // Verification section
  page.drawText('VERIFICATION', {
    x: margin,
    y: currentY,
    size: 12,
    font: titleFont,
    color: darkBlue,
  })
  currentY -= 20
  
  const verifyText = `This certificate can be verified at any time using ID: ${data.certificateUid}`
  page.drawText(verifyText, {
    x: margin,
    y: currentY,
    size: 9,
    font: bodyFont,
    color: lightGray,
  })
  currentY -= 40
  
  // Footer section
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 1,
    color: lightGray,
  })
  currentY -= 20
  
  // Generation details
  const generatedText = `Generated on ${formatDate(data.generationDate.split('T')[0])} by Smart Shift Tracker`
  page.drawText(generatedText, {
    x: margin,
    y: currentY,
    size: 8,
    font: smallFont,
    color: lightGray,
  })
  
  // Digital signature notice
  page.drawText('This is a digitally generated certificate.', {
    x: width - margin - 200,
    y: currentY,
    size: 8,
    font: smallFont,
    color: lightGray,
  })
  
  // Generate QR code placeholder (in a real implementation, you'd generate an actual QR code)
  const qrSize = 60
  page.drawRectangle({
    x: width - margin - qrSize,
    y: height - margin - qrSize,
    width: qrSize,
    height: qrSize,
    borderColor: lightGray,
    borderWidth: 1,
  })
  
  page.drawText('QR', {
    x: width - margin - qrSize + 20,
    y: height - margin - 35,
    size: 12,
    font: titleFont,
    color: lightGray,
  })
  
  // Serialize the PDF document to bytes
  return await pdfDoc.save()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}