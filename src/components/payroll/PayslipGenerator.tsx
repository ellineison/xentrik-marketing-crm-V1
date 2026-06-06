import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface SalesEntry {
  model_name: string;
  day_of_week: number;
  earnings: number;
}

interface PayslipData {
  chatterName: string;
  weekStart: Date;
  weekEnd: Date;
  salesData: SalesEntry[];
  totalSales: number;
  hoursWorked: number;
  hourlyRate: number;
  commissionRate: number;
  commissionAmount: number;
  overtimePay: number;
  overtimeNotes: string;
  bonusAmount?: number;
  bonusNotes?: string;
  deductionAmount: number;
  deductionNotes: string;
  expectedSalary?: number;
  approvedSalary?: number | null;
  totalPayout: number;
}

export const generatePayslipPDF = (data: PayslipData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  let yPosition = 10;

  // Yellow border at top
  pdf.setFillColor(255, 255, 0);
  pdf.rect(0, 0, pageWidth, 8, 'F');
  yPosition += 8;

  // Employee Details (Left Side) with Xentrik Logo
  const xentrikLogo = new Image();
  xentrikLogo.src = '/lovable-uploads/6f555945-9bc7-43a0-b5aa-a98a240087ba.png';
  pdf.addImage(xentrikLogo.src, 'PNG', 20, yPosition, 40, 15);
  yPosition += 20;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.chatterName, 20, yPosition);
  yPosition += 6;
  const dateRange = `Cut-off Period: ${format(data.weekStart, 'MM/dd')} - ${format(data.weekEnd, 'MM/dd')}`;
  pdf.text(dateRange, 20, yPosition);

  // Company Details (Right Side)
  const rightMargin = pageWidth - 20;
  let rightYPosition = yPosition - 14;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('XENTRIK PTY LTD', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text('8 Bentine Street Para Vista', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.text('5093 South Australia', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.text('+61422789156', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.text('Xentrikmarketing@outlook.com', rightMargin, rightYPosition, { align: 'right' });

  yPosition += 14;

  // Yellow Payslip Header Bar
  pdf.setFillColor(255, 255, 0);
  pdf.rect(20, yPosition, pageWidth - 40, 10, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Payslip', 25, yPosition + 7);
  const payslipNumber = `#${format(data.weekStart, 'MMdd')}-${format(data.weekEnd, 'MMdd')}`;
  pdf.text(payslipNumber, pageWidth - 25, yPosition + 7, { align: 'right' });
  yPosition += 16;

  // Payment Summary Table (compact)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Payment Summary', 20, yPosition);
  yPosition += 5;

  // Column layout
  const tableX = 20;
  const tableW = pageWidth - 40;
  const col1 = tableX;                   // Item
  const col2 = tableX + 55;              // Reason / Details
  const col3 = tableX + tableW - 5;      // Amount (right aligned)
  const rowH = 6;

  // Header row
  pdf.setFillColor(245, 245, 245);
  pdf.rect(tableX, yPosition, tableW, rowH, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Item', col1 + 2, yPosition + 4);
  pdf.text('Reason / Details', col2, yPosition + 4);
  pdf.text('Amount', col3, yPosition + 4, { align: 'right' });
  yPosition += rowH;

  const bonusAmount = data.bonusAmount || 0;
  const expectedSalary = data.expectedSalary ?? data.totalPayout;
  const approvedSalary = data.approvedSalary;

  const rows: Array<{
    item: string;
    detail: string;
    amount: string;
    bold?: boolean;
    color?: [number, number, number];
  }> = [
    { item: 'Total Weekly Sales', detail: '', amount: `$${data.totalSales.toFixed(2)}` },
    { item: 'Commission Rate', detail: `${data.commissionRate}%`, amount: `$${data.commissionAmount.toFixed(2)}` },
    { item: 'Hours Worked', detail: `${data.hoursWorked} hours @ $${data.hourlyRate.toFixed(2)}/hr`, amount: `$${(data.hoursWorked * data.hourlyRate).toFixed(2)}` },
    { item: 'Overtime Pay', detail: data.overtimeNotes || '', amount: `+$${data.overtimePay.toFixed(2)}` },
    { item: 'Bonus Pay', detail: data.bonusNotes || '', amount: `+$${bonusAmount.toFixed(2)}` },
    { item: 'Deduction', detail: data.deductionNotes || '', amount: `-$${data.deductionAmount.toFixed(2)}` },
    { item: 'Expected Salary', detail: 'System-computed salary', amount: `$${expectedSalary.toFixed(2)}` },
  ];

  if (approvedSalary !== null && approvedSalary !== undefined) {
    rows.push({
      item: 'Approved Salary',
      detail: 'Final admin-approved payout',
      amount: `$${approvedSalary.toFixed(2)}`,
      bold: true,
      color: [37, 99, 235], // blue
    });
  }

  rows.push({
    item: 'Total Pay',
    detail: 'Final payable amount',
    amount: `$${data.totalPayout.toFixed(2)}`,
    bold: true,
  });

  // Render rows
  rows.forEach((row, i) => {
    if (i % 2 === 1) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(tableX, yPosition, tableW, rowH, 'F');
    }
    pdf.setFontSize(8);
    pdf.setFont('helvetica', row.bold ? 'bold' : 'normal');
    if (row.color) {
      pdf.setTextColor(row.color[0], row.color[1], row.color[2]);
    } else {
      pdf.setTextColor(0, 0, 0);
    }
    pdf.text(row.item, col1 + 2, yPosition + 4);

    // Detail (truncate if too long)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    const detailMaxWidth = col3 - col2 - 25;
    const detailLines = pdf.splitTextToSize(row.detail, detailMaxWidth);
    pdf.text(detailLines[0] || '', col2, yPosition + 4);

    // Amount
    pdf.setFont('helvetica', row.bold ? 'bold' : 'normal');
    pdf.setFontSize(8);
    if (row.color) {
      pdf.setTextColor(row.color[0], row.color[1], row.color[2]);
    }
    pdf.text(row.amount, col3, yPosition + 4, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    yPosition += rowH;
  });

  // Table bottom border
  pdf.setDrawColor(220, 220, 220);
  pdf.line(tableX, yPosition, tableX + tableW, yPosition);
  yPosition += 6;

  // Yellow separator
  pdf.setFillColor(255, 255, 0);
  pdf.rect(20, yPosition, pageWidth - 40, 2, 'F');
  yPosition += 7;

  // Closing paragraph (compact)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  const startDate = format(data.weekStart, 'MMM dd, yyyy');
  const endDate = format(data.weekEnd, 'MMM dd, yyyy');
  const payslipText = `This payslip covers the sales period from ${startDate} to ${endDate}. During this week, your total earnings amounted to $${data.totalSales.toFixed(2)}. Based on your performance, you qualify for a ${data.commissionRate}% commission, earning you an additional $${data.commissionAmount.toFixed(2)} in commission. You worked ${data.hoursWorked} hours this week. Your total payout for the week is $${data.totalPayout.toFixed(2)}. Thank you for your consistent work and dedication.`;
  const splitText = pdf.splitTextToSize(payslipText, pageWidth - 40);
  pdf.text(splitText, 20, yPosition);
  yPosition += splitText.length * 4 + 6;

  // Reserve signature + footer space on page 1
  const SIGNATURE_BLOCK_HEIGHT = 38;
  const FOOTER_BLOCK_HEIGHT = 12;
  const BOTTOM_MARGIN = 8;
  const reserved = SIGNATURE_BLOCK_HEIGHT + FOOTER_BLOCK_HEIGHT + BOTTOM_MARGIN;
  const maxSignatureY = pageHeight - reserved;
  const signatureYPosition = Math.min(yPosition, maxSignatureY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Authorized Signatures:', 20, signatureYPosition);

  // COO
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Chief Operating Officer:', 20, signatureYPosition + 6);
  const keyshawnImg = new Image();
  keyshawnImg.src = '/lovable-uploads/044d8d27-d561-4feb-baba-fed28f199066.png';
  pdf.addImage(keyshawnImg.src, 'PNG', 20, signatureYPosition + 9, 45, 13);
  pdf.text('Keyshawn Lopez', 20, signatureYPosition + 28);

  // CEO
  pdf.text('Chief Executive Officer:', pageWidth / 2, signatureYPosition + 6);
  const michaelImg = new Image();
  michaelImg.src = '/lovable-uploads/9aae90b3-e37d-43d5-8bbd-0f0ae1c1b94c.png';
  pdf.addImage(michaelImg.src, 'PNG', pageWidth / 2, signatureYPosition + 9, 45, 13);
  pdf.text('Michael Slipek', pageWidth / 2, signatureYPosition + 28);

  // Footer
  const footerY = pageHeight - 8;
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'italic');
  const footerText = "This payslip has been issued for whatever purpose it may serve and is a true and accurate representation of the employee's earnings for the stated period.";
  const footerSplitText = pdf.splitTextToSize(footerText, pageWidth - 40);
  pdf.text(footerSplitText, pageWidth / 2, footerY, { align: 'center' });

  const fileName = `payslip_${data.chatterName.replace(/\s+/g, '_')}_${format(data.weekStart, 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName);
};
