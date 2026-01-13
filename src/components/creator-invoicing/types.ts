// Types for Creator Invoicing module

export interface CreatorInvoicingEntry {
  id?: string;
  creator_id: string;
  model_name: string;
  week_start_date: string;
  invoice_payment: boolean;
  paid: number | null;
  percentage: number;
  net_sales: number | null;
  invoice_number: number | null;
  invoice_link: string | null;
  statements_image_key: string | null;
  conversion_image_key: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeekCutoff {
  weekStart: Date;
  weekEnd: Date;
  dueDate: Date; // Day after week ends (for checklist column header)
  label: string;
}

export interface ChecklistEntry {
  model_name: string;
  creator_id: string;
  dueDate: Date;
  isPaid: boolean;
  carryOver: number | null; // Positive = overpayment (green), Negative = debt (red)
  invoiceAmount: number | null;
  paidAmount: number | null;
}

export interface Creator {
  id: string;
  name: string;
  model_name: string | null;
  default_invoice_number: number | null;
}
