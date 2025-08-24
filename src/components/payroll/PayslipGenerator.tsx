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
  deductionAmount: number;
  deductionNotes: string;
  totalPayout: number;
}

const DAYS_OF_WEEK = [
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
];

export const generatePayslipPDF = (data: PayslipData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  let yPosition = 10;

  // Yellow border at top
  pdf.setFillColor(255, 255, 0); // Yellow
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
  pdf.setFontSize(10);
  pdf.text('8 Bentine Street Para Vista', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.text('5093 South Australia', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.text('+61422789156', rightMargin, rightYPosition, { align: 'right' });
  rightYPosition += 6;
  pdf.text('Xentrikmarketing@outlook.com', rightMargin, rightYPosition, { align: 'right' });

  yPosition += 20;

  // Yellow Payslip Header Bar
  pdf.setFillColor(255, 255, 0); // Yellow
  pdf.rect(20, yPosition, pageWidth - 40, 12, 'F');
  
  // Payslip title and number
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Payslip', 25, yPosition + 8);
  
  const payslipNumber = `#${format(data.weekStart, 'MMdd')}-${format(data.weekEnd, 'MMdd')}`;
  pdf.text(payslipNumber, pageWidth - 25, yPosition + 8, { align: 'right' });
  
  yPosition += 25;

  // Summary section (no daily breakdown)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Payment Summary', 20, yPosition);
  yPosition += 15;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Total Weekly Sales: $${data.totalSales.toFixed(2)}`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Hours Worked: ${data.hoursWorked}`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Hourly Rate: $${data.hourlyRate.toFixed(2)}/hr`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Hours Pay: $${(data.hoursWorked * data.hourlyRate).toFixed(2)}`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Commission Rate: ${data.commissionRate}%`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Commission Amount: $${data.commissionAmount.toFixed(2)}`, 20, yPosition);
  yPosition += 10;
  
  // Always show overtime and deduction in two columns
  const leftColumn = pageWidth / 2 - 10; // Left column width
  let leftY = yPosition;
  let rightY = yPosition;
  
  // Left column - Overtime (always show)
  pdf.text(`Overtime Pay: $${data.overtimePay.toFixed(2)}`, 20, leftY);
  leftY += 7;
  if (data.overtimeNotes && data.overtimePay > 0) {
    pdf.setFontSize(10);
    pdf.text(`Overtime Reason: ${data.overtimeNotes}`, 20, leftY);
    leftY += 10;
  } else {
    leftY += 3;
  }
  
  // Right column - Deduction (always show)
  pdf.text(`Deduction: -$${data.deductionAmount.toFixed(2)}`, leftColumn, rightY);
  rightY += 7;
  if (data.deductionNotes && data.deductionAmount > 0) {
    pdf.setFontSize(10);
    pdf.text(`Deduction Reason: ${data.deductionNotes}`, leftColumn, rightY);
    rightY += 10;
  } else {
    rightY += 3;
  }
  
  // Set yPosition to the maximum of both columns
  yPosition = Math.max(leftY, rightY);

  // Total payout
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(`Total Payout: $${data.totalPayout.toFixed(2)}`, 20, yPosition);
  yPosition += 15;

  // Yellow border before payslip text
  pdf.setFillColor(255, 255, 0); // Yellow
  pdf.rect(20, yPosition, pageWidth - 40, 3, 'F');
  yPosition += 15;

  // Payslip paragraph
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const startDate = format(data.weekStart, 'MMM dd, yyyy');
  const endDate = format(data.weekEnd, 'MMM dd, yyyy');
  
  const payslipText = `This payslip covers the sales period from ${startDate} to ${endDate}. During this week, your total earnings amounted to $${data.totalSales.toFixed(2)}. Based on your performance, you qualify for a ${data.commissionRate}% commission, earning you an additional $${data.commissionAmount.toFixed(2)} in commission. You worked ${data.hoursWorked} hours this week. Your total payout for the week is $${data.totalPayout.toFixed(2)}. Thank you for your consistent work and dedication.`;

  const splitText = pdf.splitTextToSize(payslipText, pageWidth - 40);
  pdf.text(splitText, 20, yPosition);
  yPosition += splitText.length * 5 + 40;

  // Signature Section
  const pageHeight = pdf.internal.pageSize.height;
  const signatureYPosition = pageHeight - 65;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Authorized Signatures:', 20, signatureYPosition);
  
  // COO Signature
  pdf.setFont('helvetica', 'normal');
  pdf.text('Chief Operating Officer:', 20, signatureYPosition + 10);
  
  // Use your uploaded Keyshawn signature
  const keyshawnImg = new Image();
  keyshawnImg.src = '/lovable-uploads/044d8d27-d561-4feb-baba-fed28f199066.png';
  pdf.addImage(keyshawnImg.src, 'PNG', 20, signatureYPosition + 15, 50, 15);
  pdf.text('Keyshawn Lopez', 20, signatureYPosition + 35);
  
  // CEO Signature  
  pdf.text('Chief Executive Officer:', pageWidth / 2, signatureYPosition + 10);
  
  // Use your uploaded Michael signature
  const michaelImg = new Image();
  michaelImg.src = '/lovable-uploads/9aae90b3-e37d-43d5-8bbd-0f0ae1c1b94c.png';
  pdf.addImage(michaelImg.src, 'PNG', pageWidth / 2, signatureYPosition + 15, 50, 15);
  pdf.text('Michael Slipek', pageWidth / 2, signatureYPosition + 35);

  // Footer
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  const footerText = "This payslip has been issued for whatever purpose it may serve and is a true and accurate representation of the employee's earnings for the stated period.";
  const footerSplitText = pdf.splitTextToSize(footerText, pageWidth - 40);
  pdf.text(footerSplitText, pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Save the PDF
  const fileName = `payslip_${data.chatterName.replace(/\s+/g, '_')}_${format(data.weekStart, 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName);
};