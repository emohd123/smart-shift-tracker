import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { MultiCompanyCertificate } from '../types/certificate';
import { format } from 'date-fns';

/* ------------------------------------------------
   Color constants (RGB)
------------------------------------------------ */
const NAVY:  [number,number,number] = [26,  46,  74];
const GOLD:  [number,number,number] = [197, 160, 40];
const CREAM: [number,number,number] = [250, 248, 240];
const CREAM_DARK: [number,number,number] = [240, 237, 224];
const WHITE: [number,number,number] = [255, 255, 255];
const GREY:  [number,number,number] = [136, 136, 136];
const DARK:  [number,number,number] = [30,  30,  30];
const VERIFIED_GREEN: [number,number,number] = [26, 58, 42];

/* ------------------------------------------------
   Helpers
------------------------------------------------ */
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

function fmtDate(dateStr: string): string {
  try { return format(new Date(dateStr), 'MMM dd, yyyy'); }
  catch { return dateStr; }
}

/* Draw a centered circle (no fill, just border) */
function drawCircle(
  doc: jsPDF,
  cx: number, cy: number, r: number,
  strokeColor: [number,number,number],
  fillColor?: [number,number,number]
) {
  doc.setDrawColor(...strokeColor);
  if (fillColor) {
    doc.setFillColor(...fillColor);
    doc.circle(cx, cy, r, 'FD');
  } else {
    doc.circle(cx, cy, r, 'S');
  }
}

/* Clip a circle for image rendering (approximate with a filled white circle mask before image) */
function addCircularImage(
  doc: jsPDF,
  imgData: string,
  cx: number, cy: number, r: number
) {
  // Draw image as square, then overdraw circle border — jsPDF has no clip API easily
  doc.addImage(imgData, 'JPEG', cx - r, cy - r, r * 2, r * 2);
  // Overdraw the outer area with CREAM to simulate circle clip (crude but effective)
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, r, 'S');
}

/* ------------------------------------------------
   Main export
------------------------------------------------ */
export async function generateMultiCompanyPDF(
  data: MultiCompanyCertificate
): Promise<Blob> {

  // Portrait A4
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;

  // Outer border insets
  const outerM = 6;
  const innerM = 10;
  const contentL = 14; // left edge of content
  const contentR = PW - 14; // right edge of content
  const contentW = contentR - contentL; // ~182mm

  // Two-column split
  const leftW  = 60; // mm
  const gap    = 6;
  const rightX = contentL + leftW + gap;
  const rightW = contentW - leftW - gap;

  /* ---- OUTER NAVY BORDER ---- */
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.setFillColor(...CREAM);
  doc.rect(outerM, outerM, PW - outerM * 2, PH - outerM * 2, 'FD');

  /* ---- INNER GOLD BORDER ---- */
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.rect(innerM, innerM, PW - innerM * 2, PH - innerM * 2, 'S');

  /* ================================================
     HEADER
  ================================================ */
  let yHeader = 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...GOLD);
  doc.setCharSpace(6);
  doc.text('CERTIFICATE', PW / 2, yHeader, { align: 'center' });
  doc.setCharSpace(0);

  yHeader += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('of Employment', PW / 2, yHeader, { align: 'center' });

  yHeader += 5;
  // Gold divider line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(PW / 2 - 25, yHeader, PW / 2 + 25, yHeader);

  yHeader += 5;
  // Draw three diamonds manually (jsPDF helvetica lacks ◆ glyph)
  const dSize = 2.5;
  const dY = yHeader - dSize / 2;
  for (let i = -1; i <= 1; i++) {
    const dCX = PW / 2 + i * 8;
    doc.setFillColor(...GOLD);
    doc.lines(
      [[dSize, dSize], [dSize, -dSize], [-dSize, -dSize], [-dSize, dSize]],
      dCX - dSize, dY, [1, 1], 'F', true
    );
  }

  /* ================================================
     BODY: two columns
  ================================================ */
  const bodyTop = yHeader + 6;

  /* ---- LEFT COLUMN ---- */
  const leftCX = contentL + leftW / 2; // center x of left col
  let leftY = bodyTop;

  // Avatar circle
  const avatarR = 13;
  const avatarCY = leftY + avatarR + 2;

  if (data.promoter?.profile_photo_url) {
    const img = await loadImageAsBase64(data.promoter.profile_photo_url);
    if (img) {
      addCircularImage(doc, img, leftCX, avatarCY, avatarR);
    } else {
      drawCircle(doc, leftCX, avatarCY, avatarR, GOLD, CREAM);
    }
  } else {
    drawCircle(doc, leftCX, avatarCY, avatarR, GOLD, CREAM);
    // Initials
    const initials = data.promoterName
      .split(' ')
      .map(n => n[0] || '')
      .join('')
      .substring(0, 2)
      .toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.text(initials, leftCX, avatarCY + 2, { align: 'center' });
  }

  leftY = avatarCY + avatarR + 5;

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  const nameLine = doc.splitTextToSize(data.promoterName, leftW - 2);
  doc.text(nameLine, leftCX, leftY, { align: 'center' });
  leftY += nameLine.length * 5;

  // "PROMOTER" label
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.setCharSpace(2);
  doc.text('PROMOTER', leftCX, leftY, { align: 'center' });
  doc.setCharSpace(0);
  leftY += 6;

  // Info card box
  const infoBoxX = contentL + 1;
  const infoBoxW = leftW - 2;
  const infoItems: [string, string][] = [
    ['Nationality', data.promoter?.nationality || '-'],
    ['Code',        data.promoter?.unique_code  || data.referenceNumber],
    ['Phone',       data.promoter?.phone_number || '-'],
    ['Email',       data.promoter?.email        || '-'],
    ['Issued',      fmtDate(data.issueDate)],
  ];
  const infoLineH = 5.5;
  const infoBoxH = infoItems.length * infoLineH + 6;

  doc.setFillColor(...CREAM_DARK);
  doc.setDrawColor(...CREAM_DARK);
  doc.rect(infoBoxX, leftY, infoBoxW, infoBoxH, 'F');

  let infoY = leftY + 5;
  for (const [label, value] of infoItems) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD);
    doc.text(`${label}:`, infoBoxX + 2, infoY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...DARK);
    const val = doc.splitTextToSize(value, infoBoxW - 22);
    doc.text(val[0] || value, infoBoxX + infoBoxW - 2, infoY, { align: 'right' });
    infoY += infoLineH;
  }

  /* ---- RIGHT COLUMN ---- */
  let rightY = bodyTop;

  for (let ci = 0; ci < data.companies.length; ci++) {
    const entry = data.companies[ci];
    const isLast = ci === data.companies.length - 1;

    /* Company card */
    const compCardStartY = rightY;
    const compCardH = 34;

    doc.setFillColor(...CREAM_DARK);
    doc.setDrawColor(...CREAM_DARK);
    doc.rect(rightX, compCardStartY, rightW, compCardH, 'F');

    let ccY = compCardStartY + 4;
    let ccTextX = rightX + 4;

    // Company logo
    if (entry.company.logo_url) {
      const logo = await loadImageAsBase64(entry.company.logo_url);
      if (logo) {
        doc.addImage(logo, 'PNG', rightX + 2, compCardStartY + 2, 18, 12);
        ccY = compCardStartY + 4;
        ccTextX = rightX + 24;
      }
    }

    // Company name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(entry.company.name, ccTextX, ccY + 4);

    ccY += 9;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GREY);
    doc.setCharSpace(1.5);
    doc.text('ADVERTISING AND PROMOTION', ccTextX, ccY);
    doc.setCharSpace(0);
    ccY += 5;

    // Website / email / CR
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    if (entry.company.website) {
      doc.text(`Website: ${entry.company.website}`, ccTextX, ccY);
      ccY += 4;
    }
    if (entry.company.email) {
      doc.text(`Email: ${entry.company.email}`, ccTextX, ccY);
      ccY += 4;
    }
    const crNum = (entry.company as any).cr_number || entry.company.registration_number;
    if (crNum) {
      doc.text(`CR/Reg. No: ${crNum}`, ccTextX, ccY);
      ccY += 4;
    }

    // VERIFIED EMPLOYER button
    const btnW = 36;
    const btnH = 5.5;
    const btnX = rightX + rightW - btnW - 3;
    const btnY = compCardStartY + compCardH - btnH - 3;
    doc.setFillColor(...VERIFIED_GREEN);
    doc.rect(btnX, btnY, btnW, btnH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...WHITE);
    doc.setCharSpace(0.5);
    doc.text('VERIFIED EMPLOYER', btnX + btnW / 2, btnY + btnH - 1.5, { align: 'center' });
    doc.setCharSpace(0);

    rightY = compCardStartY + compCardH + 3;

    /* Work Assignments heading */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text('Work Assignments', rightX, rightY + 3);
    rightY += 5;

    /* Table */
    autoTable(doc, {
      startY: rightY,
      margin: { left: rightX, right: contentL + 2 },
      tableWidth: rightW,
      head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
      body: entry.shifts.map(s => [
        s.title || 'Unnamed Event',
        fmtDate(s.dateFrom),
        s.location || 'On-site',
        `${roundHours(s.totalHours)}h`,
      ]),
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: NAVY,
        textColor: CREAM,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: CREAM_DARK },
      columnStyles: {
        0: { cellWidth: rightW * 0.38 },
        1: { cellWidth: rightW * 0.24 },
        2: { cellWidth: rightW * 0.26 },
        3: { cellWidth: rightW * 0.12, halign: 'right', fontStyle: 'bold' },
      },
    });

    const tableEndY: number = (doc as any).lastAutoTable.finalY;
    rightY = tableEndY + 3;

    /* Per-company total box */
    const totalBoxH = 16;
    doc.setFillColor(...CREAM_DARK);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(rightX, rightY, rightW, totalBoxH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GREY);
    doc.setCharSpace(1.2);
    doc.text('TOTAL VERIFIED WORK EXPERIENCE', rightX + rightW / 2, rightY + 4.5, { align: 'center' });
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    const hrs = roundHours(entry.totalHours);
    doc.text(`${hrs} Hour${hrs !== 1 ? 's' : ''}`, rightX + rightW / 2, rightY + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GREY);
    doc.text('Across 1 organization', rightX + rightW / 2, rightY + 14.5, { align: 'center' });

    rightY += totalBoxH + (isLast ? 0 : 6);
  }

  /* Grand total (multiple companies) */
  if (data.companies.length > 1) {
    rightY += 4;
    const gtBoxH = 18;
    doc.setFillColor(...CREAM);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.rect(rightX, rightY, rightW, gtBoxH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GREY);
    doc.setCharSpace(1.2);
    doc.text('GRAND TOTAL WORK EXPERIENCE', rightX + rightW / 2, rightY + 5, { align: 'center' });
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...GOLD);
    doc.text(`${roundHours(data.grandTotalHours)} Hours`, rightX + rightW / 2, rightY + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GREY);
    doc.text(`Across ${data.companies.length} organizations`, rightX + rightW / 2, rightY + 17, { align: 'center' });

    rightY += gtBoxH;
  }

  /* ================================================
     BOTTOM ROW  (QR | Seal+Signature | Date+ID)
  ================================================ */
  const bottomY = Math.max(rightY, 230) + 6;
  // Separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(contentL, bottomY, contentR, bottomY);

  const rowY = bottomY + 4;

  /* QR code */
  const isPreview = data.referenceNumber === 'PREVIEW';
  if (!isPreview) {
    const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;
    try {
      const qr = await QRCode.toDataURL(verifyUrl, { width: 120 });
      doc.addImage(qr, 'PNG', contentL, rowY, 18, 18);
    } catch { /* skip if QR fails */ }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GREY);
    doc.text('Scan to Verify', contentL + 9, rowY + 20, { align: 'center' });
  } else {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(contentL, rowY, 18, 18, 'S');
    doc.setFontSize(5);
    doc.setTextColor(...GREY);
    doc.text('QR Code', contentL + 9, rowY + 10, { align: 'center' });
  }

  /* Official Seal (center) */
  const sealCX = PW / 2;
  const sealCY = rowY + 10;
  drawCircle(doc, sealCX, sealCY, 11, GOLD, CREAM);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD);
  doc.text('OFFICIAL', sealCX, sealCY - 1, { align: 'center' });
  doc.text('SEAL',     sealCX, sealCY + 4, { align: 'center' });

  // Signature line below seal
  const sigY = rowY + 24;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.line(sealCX - 20, sigY, sealCX + 20, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...GREY);
  doc.text('Authorized Signature', sealCX, sigY + 3.5, { align: 'center' });

  /* Date + Cert ID (right) */
  const dateX = contentR;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text('Date of Issue', dateX, rowY + 2, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(fmtDate(data.issueDate), dateX, rowY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text(isPreview ? 'PREVIEW-ONLY' : data.referenceNumber, dateX, rowY + 13, { align: 'right' });

  /* ================================================
     FOOTER
  ================================================ */
  const footerY = PH - 12;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(contentL, footerY - 3, contentR, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.text(
    'SmartShift Tracker — This certificate was generated digitally and is verifiable via QR code or online at smart.onestoneads.com',
    PW / 2,
    footerY,
    { align: 'center' }
  );

  return doc.output('blob');
}
