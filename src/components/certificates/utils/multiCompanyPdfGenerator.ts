import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { MultiCompanyCertificate } from '../types/certificate';

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

/* ------------------------------------------------
   PDF Generator
------------------------------------------------ */

export async function generateMultiCompanyPDF(
  data: MultiCompanyCertificate
): Promise<Blob> {

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

  /* ------------------------------------------------
     Colors
  ------------------------------------------------ */

  const primary: [number, number, number] = [37, 99, 235];
  const muted: [number, number, number] = [100, 116, 139];
  const dark: [number, number, number] = [15, 23, 42];
  const border: [number, number, number] = [226, 232, 240];
  const bg: [number, number, number] = [248, 250, 252];

  /* ------------------------------------------------
     WATERMARK (SUBTLE)
  ------------------------------------------------ */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(245, 247, 250);
  doc.text(
    'SMARTSHIFT',
    pageWidth / 2,
    pageHeight / 2 + 20,
    { align: 'center', angle: 25 }
  );

  /* ------------------------------------------------
     HEADER
  ------------------------------------------------ */

  doc.setFontSize(18);
  doc.setTextColor(...primary);
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

  /* ------------------------------------------------
     PROMOTER PROFILE CARD
  ------------------------------------------------ */

  doc.setFillColor(...bg);
  doc.setDrawColor(...border);
  doc.rect(margin, yPos, cardWidth, 36, 'FD');

  const profileX = margin + 10;
  const profileY = yPos + 8;

  if (data.promoter?.profile_photo_url) {
    const img = await loadImageAsBase64(data.promoter.profile_photo_url);
    if (img) doc.addImage(img, 'JPEG', profileX, profileY, 20, 20);
  }

  const textX = profileX + 26;

  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(data.promoterName, textX, profileY + 5);

  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text('Promoter', textX, profileY + 11);

  const issueDate = new Date(data.issueDate || new Date()).toLocaleDateString(
    'en-US',
    { month: 'long', day: '2-digit', year: 'numeric' }
  );

  doc.text(`Issued on: ${issueDate}`, textX, profileY + 17);

  /* --- Promoter Details Grid --- */

  const infoY = profileY + 23;
  const col2X = textX + 70;

  doc.setFontSize(7.5);
  doc.text(`Email: ${data.promoter?.email || '-'}`, textX, infoY);
  doc.text(`Phone: ${data.promoter?.phone_number || '-'}`, textX, infoY + 5);

  doc.text(`Nationality: ${data.promoter?.nationality || '-'}`, col2X, infoY);
  doc.text(`Code: ${data.promoter?.unique_code || '-'}`, col2X, infoY + 5);

  yPos += 46;

  /* ------------------------------------------------
     COMPANY WORK CARDS (WITH DETAILS)
  ------------------------------------------------ */

  for (const company of data.companies) {

    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    const cardStartY = yPos;

    doc.setFillColor(...bg);
    doc.setDrawColor(...border);
    doc.rect(margin, cardStartY, cardWidth, 44, 'FD');

    /* Logo */
    if (company.company.logo_url) {
      const logo = await loadImageAsBase64(company.company.logo_url);
      if (logo) doc.addImage(logo, 'PNG', margin + 12, cardStartY + 10, 20, 20);
    }

    const cx = margin + 40;
    let cy = cardStartY + 14;

    /* Company Name */
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company.name, cx, cy);

    cy += 6;

    /* Industry / Type - using optional field from type */
    const companyAny = company.company as any;
    if (companyAny.industry) {
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.text(companyAny.industry, cx, cy);
      cy += 5;
    }

    /* Location - using optional fields from type */
    const location = [companyAny.city, companyAny.country].filter(Boolean).join(', ');
    if (location) {
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Location: ${location}`, cx, cy);
      cy += 5;
    }

    /* Website */
    if (company.company.website) {
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Website: ${company.company.website}`, cx, cy);
      cy += 5;
    }

    /* Email */
    if (company.company.email) {
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Email: ${company.company.email}`, cx, cy);
      cy += 5;
    }

    /* Phone */
    if (company.company.phone_number) {
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Phone: ${company.company.phone_number}`, cx, cy);
      cy += 5;
    }

    /* Contact Person - only if it exists in data */
    if (company.company.contact_person) {
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Contact: ${company.company.contact_person}`, cx, cy);
      cy += 5;
    }

    /* CR / Registration Number */
    const crNumber = companyAny.cr_number || company.company.registration_number;
    if (crNumber) {
      doc.setFontSize(8);
      doc.setTextColor(...dark);
      doc.text(`CR / Reg. No: ${crNumber}`, cx, cy);
      cy += 6;
    }

    /* Total Hours */
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    doc.text(`Total Verified Hours: ${roundHours(company.totalHours)}`, cx, cy);

    yPos = cardStartY + 50;

    /* Work Assignments */
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text('Work Assignments', margin + 12, yPos);

    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin + 12, right: margin + 12 },
      tableWidth: cardWidth - 24,
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
    yPos = endY + 14;
  }

  /* ------------------------------------------------
     SUMMARY + QR
  ------------------------------------------------ */

  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;
  const qr = await QRCode.toDataURL(verifyUrl, { width: 120 });

  doc.setFillColor(235, 245, 255);
  doc.rect(margin, yPos, cardWidth, 20, 'F');

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text(
    `${roundHours(data.grandTotalHours)} VERIFIED WORK HOURS`,
    margin + 10,
    yPos + 13
  );

  doc.addImage(qr, 'PNG', pageWidth - margin - 22, yPos + 3, 16, 16);

  yPos += 28;

  /* ------------------------------------------------
     FOOTER
  ------------------------------------------------ */

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text(
    `Certificate Reference: ${data.referenceNumber}`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  doc.text(
    'Generated digitally by SmartShift Tracker • Verifiable via QR code',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc.output('blob');
}
