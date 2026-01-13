import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { receipt_id } = await req.json();

    if (!receipt_id) {
      return new Response(
        JSON.stringify({ error: "receipt_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch receipt with all related data
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("payment_receipts")
      .select(`
        *,
        shifts:shift_id (
          id,
          title,
          date,
          end_date,
          start_time,
          end_time,
          location,
          pay_rate,
          pay_rate_type
        ),
        company:company_id (
          id,
          full_name,
          email,
          phone_number
        ),
        promoter:promoter_id (
          id,
          full_name,
          email,
          phone_number,
          iban_number,
          bank_name,
          bank_account_holder_name
        )
      `)
      .eq("id", receipt_id)
      .single();

    if (receiptError || !receipt) {
      console.error("Error fetching receipt:", receiptError);
      return new Response(
        JSON.stringify({ error: "Receipt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch time logs for this assignment to get total hours
    const { data: timeLogs } = await supabaseAdmin
      .from("time_logs")
      .select("total_hours")
      .eq("shift_id", receipt.shift_id)
      .eq("user_id", receipt.promoter_id)
      .not("check_out_time", "is", null);

    const totalHours = timeLogs?.reduce((sum, log) => sum + (log.total_hours || 0), 0) || 0;

    // Generate receipt HTML
    const html = generateReceiptHTML(receipt, totalHours);

    // For now, we'll store the HTML and convert to PDF using a service
    // In production, you might want to use:
    // - Puppeteer/Playwright via a cloud service
    // - @react-pdf/renderer if using React components
    // - A PDF generation API service
    
    // Generate file content (HTML for now, can be converted to PDF later)
    // For production, implement proper PDF generation using a service
    const fileContent = await generatePDFFromHTML(html);
    
    // Store as HTML for now - users can print to PDF from browser
    // TODO: Implement proper PDF generation and change extension to .pdf
    const fileName = `receipts/${receipt.promoter_id}/${receipt.receipt_number}.html`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("receipts")
      .upload(fileName, fileContent, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      // Don't fail the entire operation if upload fails
      // The receipt is still created, PDF can be regenerated
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("receipts")
      .getPublicUrl(fileName);

    // Update receipt with file URL (HTML for now, PDF later)
    const { error: updateError } = await supabaseAdmin
      .from("payment_receipts")
      .update({
        pdf_url: fileName, // Stored as HTML for now, will be PDF after proper implementation
        pdf_generated_at: new Date().toISOString(),
      })
      .eq("id", receipt_id);

    if (updateError) {
      console.error("Error updating receipt:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_url: urlData.publicUrl,
        receipt_id: receipt_id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateReceiptHTML(receipt: any, totalHours: number): string {
  const shift = Array.isArray(receipt.shifts) ? receipt.shifts[0] : receipt.shifts;
  const company = Array.isArray(receipt.company) ? receipt.company[0] : receipt.company;
  const promoter = Array.isArray(receipt.promoter) ? receipt.promoter[0] : receipt.promoter;

  const receiptDate = new Date(receipt.receipt_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const paymentDate = receipt.bank_transfer_date 
    ? new Date(receipt.bank_transfer_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : receiptDate;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receipt.receipt_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #0066cc;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .receipt-number {
      font-size: 14px;
      color: #666;
      font-weight: 600;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background-color: #f0f8ff;
      padding: 12px 15px;
      border-left: 4px solid #0066cc;
      margin-bottom: 15px;
      font-size: 16px;
      font-weight: 600;
      color: #0066cc;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #333;
      min-width: 200px;
    }
    .detail-value {
      color: #666;
      text-align: right;
    }
    .amount-box {
      background-color: #e8f5e9;
      border: 2px solid #4caf50;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
      margin: 20px 0;
    }
    .amount-box .amount {
      font-size: 32px;
      font-weight: bold;
      color: #2e7d32;
      margin: 10px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PAYMENT RECEIPT</h1>
      <div class="receipt-number">Receipt Number: ${receipt.receipt_number}</div>
      <div style="margin-top: 10px; font-size: 14px; color: #666;">Date: ${receiptDate}</div>
    </div>

    <div class="amount-box">
      <div style="font-size: 14px; color: #666;">Amount Paid</div>
      <div class="amount">${receipt.amount.toFixed(3)} ${receipt.currency}</div>
    </div>

    <div class="section">
      <div class="section-title">PAYMENT DETAILS</div>
      <div class="detail-row">
        <span class="detail-label">Payment Method</span>
        <span class="detail-value">${receipt.payment_method === 'bank_transfer' ? 'Bank Transfer' : receipt.payment_method}</span>
      </div>
      ${receipt.transaction_reference ? `
      <div class="detail-row">
        <span class="detail-label">Transaction Reference</span>
        <span class="detail-value" style="font-family: monospace;">${receipt.transaction_reference}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Payment Date</span>
        <span class="detail-value">${paymentDate}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">FROM (COMPANY)</div>
      <div class="detail-row">
        <span class="detail-label">Company Name</span>
        <span class="detail-value">${company?.full_name || 'N/A'}</span>
      </div>
      ${company?.email ? `
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${company.email}</span>
      </div>
      ` : ''}
      ${company?.phone_number ? `
      <div class="detail-row">
        <span class="detail-label">Phone</span>
        <span class="detail-value">${company.phone_number}</span>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">TO (PROMOTER)</div>
      <div class="detail-row">
        <span class="detail-label">Name</span>
        <span class="detail-value">${promoter?.full_name || 'N/A'}</span>
      </div>
      ${promoter?.email ? `
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${promoter.email}</span>
      </div>
      ` : ''}
      ${receipt.iban_number ? `
      <div class="detail-row">
        <span class="detail-label">IBAN</span>
        <span class="detail-value" style="font-family: monospace;">${receipt.iban_number}</span>
      </div>
      ` : ''}
      ${receipt.bank_name ? `
      <div class="detail-row">
        <span class="detail-label">Bank</span>
        <span class="detail-value">${receipt.bank_name}</span>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">SHIFT INFORMATION</div>
      <div class="detail-row">
        <span class="detail-label">Shift Title</span>
        <span class="detail-value">${shift?.title || 'N/A'}</span>
      </div>
      ${shift?.date ? `
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${new Date(shift.date).toLocaleDateString()}</span>
      </div>
      ` : ''}
      ${shift?.start_time && shift?.end_time ? `
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${shift.start_time} - ${shift.end_time}</span>
      </div>
      ` : ''}
      ${shift?.location ? `
      <div class="detail-row">
        <span class="detail-label">Location</span>
        <span class="detail-value">${shift.location}</span>
      </div>
      ` : ''}
      ${totalHours > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Total Hours Worked</span>
        <span class="detail-value">${totalHours.toFixed(2)} hours</span>
      </div>
      ` : ''}
    </div>

    ${receipt.notes ? `
    <div class="section">
      <div class="section-title">NOTES</div>
      <div style="padding: 10px 0; color: #666;">${receipt.notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      <p>This is an official receipt for payment received.</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 10px;">Thank you for your service!</p>
    </div>
  </div>
</body>
</html>
  `;
}

async function generatePDFFromHTML(html: string): Promise<Uint8Array> {
  // TODO: Implement proper PDF generation
  // Current implementation stores HTML - users can print to PDF from browser
  // For production, consider:
  // 1. Puppeteer/Playwright via cloud service (Browserless, etc.)
  // 2. PDF API service (PDFShift, HTMLPDF API, etc.)
  // 3. Deno-compatible PDF library
  
  // For now, we'll store the HTML and let users download/print it
  // The HTML is print-friendly and can be saved as PDF from browser
  const encoder = new TextEncoder();
  return encoder.encode(html);
  
  // Future implementation example:
  // const response = await fetch('https://api.pdfservice.com/generate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
  //   body: JSON.stringify({ html, options: { format: 'A4', printBackground: true } })
  // });
  // if (!response.ok) throw new Error('PDF generation failed');
  // return new Uint8Array(await response.arrayBuffer());
}
