import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { MultiCompanyCertificate } from '../types/certificate';

/* ---------------------------------------------
   Helpers
--------------------------------------------- */

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const roundHours = (h: number) => Math.round(h || 0);

/* ---------------------------------------------
   MAIN GENERATOR
--------------------------------------------- */

export async function generateMultiCompanyPDF(
  data: MultiCompanyCertificate
): Promise<Blob> {

  /* -------------------------------------------
     Document Setup (Landscape A4)
  ------------------------------------------- */

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 18;
  const cardWidth = pageWidth - margin * 2;

  let yPos = margin;

  /* -------------------------------------------
     Brand Colors
  ------------------------------------------- */

  const primary: [number, number, number] = [37, 99, 235];   // SmartShift Blue
  const muted: [number, number, number] = [100, 116, 139];
  const dark: [number, number, number] = [15, 23, 42];
  const border: [number, number, number] = [226, 232, 240];
  const bg: [number, number, number] = [248, 250, 252];

  /* -------------------------------------------
     SmartShift WATERMARK
  ------------------------------------------- */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(230, 235, 240);
  doc.text(
    'SMARTSHIFT',
    pageWidth / 2,
    pageHeight / 2,
    {
      align: 'center',
      angle: 30
    }
  );

  /* -------------------------------------------
     Header
  ------------------------------------------- */

  doc.setTextColor(...primary);
  doc.setFontSize(18);
  doc.text('WORK EXPERIENCE CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;

  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(
    'This document certifies verified work experience completed via SmartShift',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  yPos += 14;

  /* -------------------------------------------
     PROMOTER PROFILE BLOCK (Enhanced with all details)
  ------------------------------------------- */

  // Calculate dynamic height based on available fields
  const promoter = data.promoter;
  const hasEmail = Boolean(promoter?.email);
  const hasPhone = Boolean(promoter?.phone_number);
  const hasNationality = Boolean(promoter?.nationality);
  const hasAge = Boolean(promoter?.age);
  const hasUniqueCode = Boolean(promoter?.unique_code);
  
  // Base height: 32mm (photo 20mm + padding 12mm, or text fields if no photo)
  // Additional fields: 6mm each (matching text line spacing)
  const additionalFields = (hasEmail ? 1 : 0) + (hasPhone ? 1 : 0) + 
                          (hasNationality ? 1 : 0) + (hasAge ? 1 : 0) + 
                          (hasUniqueCode ? 1 : 0);
  const profileBlockHeight = 32 + (additionalFields * 6);

  doc.setDrawColor(...border);
  doc.setFillColor(...bg);
  doc.rect(margin, yPos, cardWidth, profileBlockHeight, 'FD');

  const profileX = margin + 10;
  const profileY = yPos + 8;
  let textY = profileY;

  // Profile Photo
  if (promoter?.profile_photo_url) {
    const img = await loadImageAsBase64(promoter.profile_photo_url);
    if (img) {
      doc.addImage(img, 'JPEG', profileX, profileY, 20, 20);
    }
  }

  const textX = profileX + 26;

  // Full Name
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text(data.promoterName, textX, textY + 6);
  textY += 6;

  // Role
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.text('Promoter', textX, textY + 6);
  textY += 6;

  // Certificate Reference
  doc.text(`Certificate Ref: ${data.referenceNumber}`, textX, textY + 6);
  textY += 6;

  // Issue Date
  const issueDate = new Date(data.issueDate || new Date()).toLocaleDateString(
    'en-US',
    { month: 'long', day: '2-digit', year: 'numeric' }
  );
  doc.text(`Issued on: ${issueDate}`, textX, textY + 6);
  textY += 6;

  // Email (if available)
  if (hasEmail) {
    doc.text(`Email: ${promoter!.email}`, textX, textY + 6);
    textY += 6;
  }

  // Phone (if available)
  if (hasPhone) {
    doc.text(`Phone: ${promoter!.phone_number}`, textX, textY + 6);
    textY += 6;
  }

  // Nationality (if available)
  if (hasNationality) {
    doc.text(`Nationality: ${promoter!.nationality}`, textX, textY + 6);
    textY += 6;
  }

  // Age (if available)
  if (hasAge) {
    doc.text(`Age: ${promoter!.age}`, textX, textY + 6);
    textY += 6;
  }

  // Unique Code (if available)
  if (hasUniqueCode) {
    doc.text(`Code: ${promoter!.unique_code}`, textX, textY + 6);
    textY += 6;
  }

  yPos += profileBlockHeight + 8;

  /* -------------------------------------------
     COMPANY WORK CARDS
  ------------------------------------------- */

  for (const company of data.companies) {

    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin;
    }

    const cardStartY = yPos;
    let contentY = cardStartY + 10;

    doc.setFillColor(...bg);
    doc.rect(margin, cardStartY, cardWidth, 10, 'F');

    if (company.company.logo_url) {
      const logo = await loadImageAsBase64(company.company.logo_url);
      if (logo) {
        doc.addImage(logo, 'PNG', margin + 10, contentY - 6, 16, 16);
      }
    }

    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company.name, margin + 32, contentY);

    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${roundHours(company.totalHours)} Total Hours`,
      pageWidth - margin - 30,
      contentY,
      { align: 'right' }
    );

    contentY += 6;

    autoTable(doc, {
      startY: contentY,
      margin: { left: margin + 10, right: margin + 10 },
      tableWidth: cardWidth - 20,
      head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
      body: company.shifts.map(s => [
        s.title || '—',
        new Date(s.dateFrom).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        s.location || 'On-site',
        `${roundHours(s.totalHours)}h`
      ]),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        lineColor: border,
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: bg,
        textColor: dark,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
      }
    });

    const endY = (doc as any).lastAutoTable.finalY;

    doc.setDrawColor(...border);
    doc.rect(margin, cardStartY, cardWidth, endY - cardStartY + 6, 'S');

    yPos = endY + 12;
  }

  /* -------------------------------------------
     SUMMARY + QR
  ------------------------------------------- */

  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;
  const qr = await QRCode.toDataURL(verifyUrl, { width: 120 });

  doc.setFillColor(240, 248, 255);
  doc.rect(margin, yPos, cardWidth, 22, 'F');

  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${roundHours(data.grandTotalHours)} Total Verified Hours`,
    margin + 10,
    yPos + 14
  );

  doc.addImage(qr, 'PNG', pageWidth - margin - 26, yPos + 3, 18, 18);

  /* -------------------------------------------
     FOOTER
  ------------------------------------------- */

  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Generated digitally by SmartShift Tracker • This certificate is verifiable via QR code',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.output('blob');
}
