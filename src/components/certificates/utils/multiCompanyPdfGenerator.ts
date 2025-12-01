import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { MultiCompanyCertificate } from '../types/certificate';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
  lastAutoTable?: { finalY: number };
}

export async function generateMultiCompanyPDF(data: MultiCompanyCertificate): Promise<Blob> {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK EXPERIENCE CERTIFICATE', 105, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Documentation of Completed Work', 105, yPos, { align: 'center' });
  
  yPos += 15;
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  // Promoter Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Promoter: ${data.promoterName}`, 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Reference: ${data.referenceNumber}`, 20, yPos);
  yPos += 6;
  doc.text(`Issue Date: ${new Date(data.issueDate).toLocaleDateString()}`, 20, yPos);
  yPos += 15;

  // Companies Section
  for (const company of data.companies) {
    // Company Header
    doc.setFillColor(240, 240, 255);
    doc.rect(20, yPos, 170, 12, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company.name, 25, yPos + 8);
    doc.setFontSize(9);
    doc.text(`${company.totalHours} hours`, 185, yPos + 8, { align: 'right' });
    yPos += 18;

    // Shifts Table
    const tableData = company.shifts.map(shift => [
      shift.title,
      `${new Date(shift.dateFrom).toLocaleDateString()} - ${new Date(shift.dateTo).toLocaleDateString()}`,
      `${shift.timeFrom} - ${shift.timeTo}`,
      shift.location || 'N/A',
      `${shift.totalHours}h`
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Campaign', 'Date Range', 'Time', 'Location', 'Hours']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable?.finalY || yPos + 20;
    yPos += 10;
  }

  // Total Summary
  yPos += 5;
  doc.setFillColor(99, 102, 241);
  doc.rect(20, yPos, 170, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${data.grandTotalHours} HOURS`, 105, yPos + 10, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // QR Code
  const qrCodeUrl = `${window.location.origin}/verify-certificate?ref=${data.referenceNumber}`;
  const qrDataUrl = await QRCode.toDataURL(qrCodeUrl);
  doc.addImage(qrDataUrl, 'PNG', 80, yPos, 50, 50);
  yPos += 55;

  doc.setFontSize(8);
  doc.text('Scan to verify certificate authenticity', 105, yPos, { align: 'center' });

  return doc.output('blob');
}
