import jsPDF from 'jspdf';
import { format, addDays } from 'date-fns';
import { CreatorInvoicingEntry, Creator } from './types';
import { getWeekEnd } from '@/utils/weekCalculations';
import { supabase } from '@/integrations/supabase/client';

interface GeneratePdfParams {
  creator: Creator;
  entry: CreatorInvoicingEntry;
  weekStart: Date;
  invoiceAmount: number | null;
  baseAmount: number | null; // Base amount before balance adjustment (net_sales * percentage)
  previousBalance: number; // Positive = credit (reduces invoice), Negative = owed (increases invoice)
  conversionRate: number | null; // USD to AUD conversion rate
}

// Helper to format invoice number as DueDate-ModelNumber
export function formatInvoiceNumber(dueDate: Date, modelNumber: number | null): string {
  if (modelNumber === null) return '-';
  const month = String(dueDate.getMonth() + 1).padStart(2, '0');
  const day = String(dueDate.getDate()).padStart(2, '0');
  const modelNum = String(modelNumber).padStart(2, '0');
  return `${month}${day}-${modelNum}`;
}

// Helper to fetch image and convert to base64 with dimensions
async function fetchImageAsBase64(url: string): Promise<{ base64: string; format: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    const contentType = blob.type;
    
    // Determine format from content type
    let format = 'JPEG';
    if (contentType.includes('png')) format = 'PNG';
    else if (contentType.includes('gif')) format = 'GIF';
    else if (contentType.includes('webp')) format = 'WEBP';
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          resolve({ base64, format, width: img.width, height: img.height });
        };
        img.onerror = () => resolve(null);
        img.src = base64;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

// Helper to calculate scaled dimensions maintaining aspect ratio
function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if wider than max
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  // Scale down if still taller than max
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

export async function generateInvoicePdf({
  creator,
  entry,
  weekStart,
  invoiceAmount,
  baseAmount,
  previousBalance,
  conversionRate,
}: GeneratePdfParams): Promise<void> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const weekEnd = getWeekEnd(weekStart);
  const dueDate = addDays(weekEnd, 1);
  
  // Calculate AUD amount if conversion rate is provided
  const invoiceAmountAud = invoiceAmount !== null && conversionRate !== null
    ? invoiceAmount * conversionRate
    : null;

  // Invoice Number
  const invoiceNumber = formatInvoiceNumber(dueDate, creator.default_invoice_number);

  // ============ FIRST PAGE - PROFESSIONAL INVOICE LAYOUT ============
  
  let y = 20;

  // --- Header Section ---
  // Xentrik Logo (top left)
  const xentrikLogo = new Image();
  xentrikLogo.src = '/lovable-uploads/6f555945-9bc7-43a0-b5aa-a98a240087ba.png';
  pdf.addImage(xentrikLogo.src, 'PNG', 20, y, 45, 18);

  // Contact info (top right)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('+61422789156', pageWidth - 20, y + 5, { align: 'right' });
  pdf.text('Xentrikmarketing@outlook.com', pageWidth - 20, y + 12, { align: 'right' });

  y += 35;

  // --- Yellow Invoice Banner ---
  pdf.setFillColor(255, 255, 0); // Yellow
  pdf.rect(20, y, pageWidth - 40, 14, 'F');
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('INVOICE', 25, y + 10);
  
  pdf.setFontSize(12);
  pdf.text(`#${invoiceNumber}`, pageWidth - 25, y + 10, { align: 'right' });

  y += 25;

  // --- Billed To / Payment To Section ---
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Billed to:', 20, y);
  pdf.text('Payment to:', pageWidth - 60, y);

  y += 6;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(creator.model_name || creator.name, 20, y);
  pdf.text('Xentrik PTY LTD', pageWidth - 60, y);

  y += 20;

  // --- Table Section ---
  const tableLeft = 20;
  const tableRight = pageWidth - 20;
  const tableWidth = tableRight - tableLeft;
  const col1Width = tableWidth * 0.35;  // Description
  const col2Width = tableWidth * 0.25;  // Total Made
  const col3Width = tableWidth * 0.20;  // Agency Cut
  const col4Width = tableWidth * 0.20;  // Amount

  // Table header (yellow background)
  pdf.setFillColor(255, 255, 0);
  pdf.rect(tableLeft, y, tableWidth, 12, 'F');
  
  // Table header border
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.rect(tableLeft, y, tableWidth, 12, 'S');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  const headerY = y + 8;
  pdf.text('DESCRIPTION', tableLeft + 5, headerY);
  pdf.text('TOTAL MADE', tableLeft + col1Width + 5, headerY);
  pdf.text('AGENCY CUT', tableLeft + col1Width + col2Width + 5, headerY);
  pdf.text('AMOUNT', tableLeft + col1Width + col2Width + col3Width + 5, headerY);

  y += 12;

  // Determine row height based on whether there's a balance adjustment
  const hasBalanceAdjustment = previousBalance !== 0 && baseAmount !== null;
  const rowHeight = hasBalanceAdjustment ? 35 : 25;
  
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(tableLeft, y, tableWidth, rowHeight, 'S');

  // Vertical lines for columns
  pdf.line(tableLeft + col1Width, y, tableLeft + col1Width, y + rowHeight);
  pdf.line(tableLeft + col1Width + col2Width, y, tableLeft + col1Width + col2Width, y + rowHeight);
  pdf.line(tableLeft + col1Width + col2Width + col3Width, y, tableLeft + col1Width + col2Width + col3Width, y + rowHeight);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const contentY = y + 10;
  const contentY2 = y + 17;
  const contentY3 = y + 24;
  
  // Description
  pdf.text('Marketing Services', tableLeft + 5, contentY);
  
  // Total Made (Net Sales with date range)
  const netSalesText = entry.net_sales !== null ? `$${entry.net_sales.toFixed(2)}USD` : '-';
  const dateRange = `(${format(weekStart, 'MM/dd')}-${format(weekEnd, 'MM/dd')})`;
  pdf.text(netSalesText, tableLeft + col1Width + 5, contentY);
  pdf.setFontSize(8);
  pdf.text(dateRange, tableLeft + col1Width + 5, contentY2);
  
  // Agency Cut (Percentage)
  pdf.setFontSize(10);
  pdf.text(`${entry.percentage}%`, tableLeft + col1Width + col2Width + 5, contentY);
  
  // Amount column - show base amount and carryover breakdown
  const amountColX = tableLeft + col1Width + col2Width + col3Width + 5;
  
  if (hasBalanceAdjustment && baseAmount !== null) {
    // Show base amount
    pdf.setFontSize(9);
    pdf.text(`$${baseAmount.toFixed(2)}USD`, amountColX, contentY);
    
    // Show carryover credit/remaining balance
    pdf.setFontSize(8);
    if (previousBalance > 0) {
      // Credit (overpayment) - reduces the invoice, shown as subtraction
      pdf.setTextColor(34, 139, 34); // Green
      pdf.text(`-$${previousBalance.toFixed(2)} credit`, amountColX, contentY2);
    } else {
      // Remaining balance (underpayment) - increases the invoice, shown as addition
      pdf.setTextColor(220, 53, 69); // Red
      pdf.text(`+$${Math.abs(previousBalance).toFixed(2)} owed`, amountColX, contentY2);
    }
    pdf.setTextColor(0, 0, 0);
    
    // Show final amount with GST note
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    const finalAmountText = invoiceAmount !== null ? `= $${invoiceAmount.toFixed(2)}USD` : '-';
    pdf.text(finalAmountText, amountColX, contentY3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('(Incl GST)', amountColX + 45, contentY3);
  } else {
    // No balance adjustment - show simple amount
    const amountUsd = invoiceAmount !== null ? `$${invoiceAmount.toFixed(2)}USD` : '-';
    pdf.text(amountUsd, amountColX, contentY);
    pdf.setFontSize(8);
    pdf.text('(Incl GST)', amountColX, contentY2);
  }

  y += rowHeight + 20;

  // --- Total Row ---
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(tableLeft, y - 5, tableRight, y - 5);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total', tableLeft + col1Width + col2Width + 20, y);
  
  pdf.setFont('helvetica', 'bold');
  // Show AUD total if conversion rate provided, otherwise show USD
  if (invoiceAmountAud !== null) {
    pdf.text(`$${invoiceAmountAud.toFixed(2)} AUD`, tableRight - 5, y, { align: 'right' });
    // Show conversion rate below
    y += 8;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`(Rate: 1 USD = ${conversionRate!.toFixed(4)} AUD)`, tableRight - 5, y, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
  } else {
    const totalDisplay = invoiceAmount !== null ? `$${invoiceAmount.toFixed(2)} USD` : '-';
    pdf.text(totalDisplay, tableRight - 5, y, { align: 'right' });
  }

  y += 5;
  pdf.line(tableLeft, y, tableRight, y);

  // --- Signature Section ---
  const signatureY = pageHeight - 85;
  
  // CEO Signature (right aligned)
  const michaelImg = new Image();
  michaelImg.src = '/lovable-uploads/9aae90b3-e37d-43d5-8bbd-0f0ae1c1b94c.png';
  pdf.addImage(michaelImg.src, 'PNG', pageWidth - 80, signatureY, 55, 20);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CEO', pageWidth - 50, signatureY + 28);

  // --- Footer Section (Terms & Conditions) ---
  const footerY = pageHeight - 40;
  
  // Separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Terms & Conditions:', 20, footerY);
  
  pdf.setFont('helvetica', 'normal');
  const termsText = 'Please send payment within seven (7) days of receiving this invoice. When sending the payment, kindly include the invoice number in the notes and send a screenshot of the transaction in the group chat for confirmation.';
  const splitTerms = pdf.splitTextToSize(termsText, pageWidth - 40);
  pdf.text(splitTerms, 20, footerY + 6);

  // ============ SECOND PAGE - SUPPORTING DOCUMENTS (IF ANY) ============
  
  const hasImages = entry.statements_image_key || entry.conversion_image_key;
  if (hasImages) {
    pdf.addPage();
    y = 20;
    
    // Header for supporting documents page
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Supporting Documents', 20, y);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #${invoiceNumber}`, pageWidth - 20, y, { align: 'right' });
    
    y += 15;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, y, pageWidth - 20, y);
    y += 10;
  }
  
  const maxImageWidth = 170;
  const maxImageHeight = 100;

  // Load and add statements image if exists
  if (entry.statements_image_key) {
    try {
      const { data } = supabase.storage.from('invoicing_documents').getPublicUrl(entry.statements_image_key);
      if (data?.publicUrl) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Week's Statements:", 20, y);
        y += 8;
        
        const imageData = await fetchImageAsBase64(data.publicUrl);
        if (imageData) {
          const { width, height } = calculateScaledDimensions(
            imageData.width,
            imageData.height,
            maxImageWidth,
            maxImageHeight
          );
          
          // Check if we need a new page
          if (y + height > 280) {
            pdf.addPage();
            y = 20;
          }
          
          pdf.addImage(imageData.base64, imageData.format, 20, y, width, height);
          y += height + 15;
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(128, 128, 128);
          pdf.text('(Image could not be loaded)', 20, y);
          pdf.setTextColor(0, 0, 0);
          y += 10;
        }
      }
    } catch (e) {
      console.error('Error adding statements image:', e);
    }
  }

  // Add conversion image if exists
  if (entry.conversion_image_key) {
    try {
      const { data } = supabase.storage.from('invoicing_documents').getPublicUrl(entry.conversion_image_key);
      if (data?.publicUrl) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text('USD to AUD Conversion:', 20, y);
        y += 8;
        
        const imageData = await fetchImageAsBase64(data.publicUrl);
        if (imageData) {
          const { width, height } = calculateScaledDimensions(
            imageData.width,
            imageData.height,
            maxImageWidth,
            maxImageHeight
          );
          
          // Check if we need a new page
          if (y + height > 280) {
            pdf.addPage();
            y = 20;
          }
          
          pdf.addImage(imageData.base64, imageData.format, 20, y, width, height);
          y += height + 10;
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(128, 128, 128);
          pdf.text('(Image could not be loaded)', 20, y);
          pdf.setTextColor(0, 0, 0);
        }
      }
    } catch (e) {
      console.error('Error adding conversion image:', e);
    }
  }

  // Save the PDF
  const fileName = `Invoice_${invoiceNumber}_${creator.model_name || creator.name}.pdf`;
  pdf.save(fileName);
}
