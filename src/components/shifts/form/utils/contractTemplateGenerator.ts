export interface ContractTemplateInput {
  shiftTitle: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  payRate: number;
  payRateType: "hourly" | "daily" | "fixed";
  paymentDate: Date;
  promoterCount: number;
  totalEstimatedPay: number;
  customTerms?: string;
  promoterName?: string;
  promoterId?: string;
  companyName?: string;
  companyId?: string;
}

export function generateContractTemplate(input: ContractTemplateInput): string {
  const {
    shiftTitle,
    description,
    location,
    startDate,
    endDate,
    startTime,
    endTime,
    payRate,
    payRateType,
    paymentDate,
    promoterCount,
    totalEstimatedPay,
    customTerms,
    promoterName,
    promoterId,
    companyName,
    companyId
  } = input;

  const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const payRateTypeLabel = {
    hourly: "per hour",
    daily: "per day",
    fixed: "fixed amount"
  }[payRateType];

  // Calculate payment per promoter
  const paymentPerPromoter = promoterCount > 0 ? totalEstimatedPay / promoterCount : totalEstimatedPay;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shift Work Contract</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 900px;
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
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
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
        .section-content {
            padding: 0 15px;
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
        .highlight-box {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .highlight-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }
        .payment-summary {
            background-color: #e8f5e9;
            border: 2px solid #4caf50;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .payment-summary-title {
            font-weight: 600;
            color: #2e7d32;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .payment-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #333;
        }
        .payment-total {
            border-top: 2px solid #4caf50;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: 700;
            font-size: 16px;
            color: #2e7d32;
        }
        .terms-list {
            list-style: none;
            padding: 0;
        }
        .terms-list li {
            padding: 10px 0;
            padding-left: 25px;
            position: relative;
            color: #555;
        }
        .terms-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4caf50;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .signature-box {
            display: inline-block;
            width: 45%;
            text-align: center;
        }
        .signature-line {
            border-top: 2px solid #333;
            margin-top: 50px;
            padding-top: 10px;
            font-size: 14px;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #999;
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📋 ${shiftTitle.toUpperCase()}</h1>
            <p style="font-size: 14px; color: #666; margin-top: 5px;">Shift Work Agreement</p>
        </div>

        <!-- Parties Section -->
        <div class="section">
            <div class="section-title">👥 AGREEMENT BETWEEN</div>
            <div class="section-content">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="border-right: 1px solid #ddd; padding-right: 20px;">
                        <h3 style="color: #0066cc; font-weight: 600; margin-bottom: 10px;">Service Provider (Company)</h3>
                        ${companyName ? `
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="detail-label" style="min-width: auto;">Company Name</span>
                        </div>
                        <div style="padding: 5px 0; color: #333; font-weight: 500; margin-bottom: 10px;">${companyName}</div>
                        ` : ''}
                    </div>
                    <div style="padding-left: 20px;">
                        <h3 style="color: #0066cc; font-weight: 600; margin-bottom: 10px;">Service Contractor (Promoter)</h3>
                        ${promoterName ? `
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="detail-label" style="min-width: auto;">Promoter Name</span>
                        </div>
                        <div style="padding: 5px 0; color: #333; font-weight: 500; margin-bottom: 10px;">${promoterName}</div>
                        ` : '<div style="color: #999; font-size: 14px;">To be filled in during assignment</div>'}
                        ${promoterId ? `
                        <div class="detail-row" style="border-bottom: none; margin-top: 10px;">
                            <span class="detail-label" style="min-width: auto;">ID Code</span>
                        </div>
                        <div style="padding: 5px 0; color: #333; font-weight: 500;">${promoterId}</div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- Shift Details Section -->
        <div class="section">
            <div class="section-title">📌 SHIFT DETAILS</div>
            <div class="section-content">
                <div class="detail-row">
                    <span class="detail-label">Location</span>
                    <span class="detail-value"><strong>${location}</strong></span>
                </div>
                ${description ? `
                <div class="detail-row">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${description}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Schedule Section -->
        <div class="section">
            <div class="section-title">📅 WORK SCHEDULE</div>
            <div class="section-content">
                <div class="detail-row">
                    <span class="detail-label">Start Date</span>
                    <span class="detail-value">${formatDate(startDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">End Date</span>
                    <span class="detail-value">${formatDate(endDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Daily Hours</span>
                    <span class="detail-value">${startTime} - ${endTime}</span>
                </div>
            </div>
        </div>

        <!-- Payment Terms Section -->
        <div class="section">
            <div class="section-title">💰 PAYMENT TERMS</div>
            <div class="section-content">
                <div class="detail-row">
                    <span class="detail-label">Pay Rate</span>
                    <span class="detail-value"><strong>BHD ${payRate.toFixed(3)} ${payRateTypeLabel}</strong></span>
                </div>
                ${promoterName ? `
                <div class="detail-row">
                    <span class="detail-label">Your Payment Amount</span>
                    <span class="detail-value"><strong>BHD ${paymentPerPromoter.toFixed(3)}</strong></span>
                </div>
                ` : `
                <div class="detail-row">
                    <span class="detail-label">Total Estimated Payment</span>
                    <span class="detail-value"><strong>BHD ${totalEstimatedPay.toFixed(3)}</strong></span>
                </div>
                `}
                <div class="detail-row">
                    <span class="detail-label">Payment Date</span>
                    <span class="detail-value"><strong>${formatDate(paymentDate)}</strong></span>
                </div>
            </div>

            <div class="payment-summary">
                <div class="payment-summary-title">💳 Payment Breakdown ${promoterName ? '(Your Amount)' : 'per Promoter'}</div>
                <div class="payment-item">
                    <span>Gross Amount</span>
                    <span>BHD ${paymentPerPromoter.toFixed(3)}</span>
                </div>
                <div class="payment-item payment-total" style="background-color: #e8f5e9; border-top: 2px solid #4caf50;">
                    <span><strong>Net Amount (100%)</strong></span>
                    <span><strong>BHD ${paymentPerPromoter.toFixed(3)}</strong></span>
                </div>
                <p style="color: #666; font-size: 13px; margin-top: 10px; font-style: italic;">
                    ✨ No deductions - you receive 100% of the gross amount
                </p>
            </div>
        </div>

        <!-- Contract Terms Section -->
        <div class="section">
            <div class="section-title">📄 CONTRACT TERMS & CONDITIONS</div>
            <div class="section-content">
                <ul class="terms-list">
                    <li><strong>Scope of Work:</strong> Promoter agrees to perform promotional activities as specified above.</li>
                    <li><strong>Professional Conduct:</strong> Promoter must maintain professional behavior and adhere to company guidelines.</li>
                    <li><strong>Punctuality:</strong> Promoter must arrive 15 minutes before shift start time.</li>
                    <li><strong>Attendance:</strong> Any absence or lateness must be notified 24 hours in advance.</li>
                    <li><strong>Confidentiality:</strong> Promoter must keep company information confidential.</li>
                    <li><strong>Payment:</strong> Payment will be processed on the agreed date through secure payment methods.</li>
                    <li><strong>Dispute Resolution:</strong> Any disputes will be resolved through mutual discussion.</li>
                    <li><strong>Term & Termination:</strong> Either party may terminate with 24 hours notice.</li>
                </ul>
                ${customTerms ? `<div class="highlight-box"><div class="highlight-title">Additional Terms:</div>${customTerms}</div>` : ""}
            </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div style="display: flex; justify-content: space-between;">
                <div class="signature-box">
                    <p style="margin: 0; font-weight: 600;">For Promoter</p>
                    <div class="signature-line">Signature & Date</div>
                </div>
                <div class="signature-box">
                    <p style="margin: 0; font-weight: 600;">For Company</p>
                    <div class="signature-line">Signature & Date</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>This is a digital contract generated on ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}. Both parties agree to the terms and conditions outlined above.</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
}
