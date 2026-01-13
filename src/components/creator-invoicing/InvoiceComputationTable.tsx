import React, { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Download, Pencil } from 'lucide-react';
import { CreatorInvoicingEntry, Creator } from './types';
import { cn } from '@/lib/utils';
import { UpdateWeekInvoiceModal } from './UpdateWeekInvoiceModal';
import { generateInvoicePdf, formatInvoiceNumber } from './InvoicePdfGenerator';
import { getWeekEnd } from '@/utils/weekCalculations';
import { ConversionRateModal } from './ConversionRateModal';

interface InvoiceComputationTableProps {
  creators: Creator[];
  invoicingData: CreatorInvoicingEntry[];
  previousWeekData: CreatorInvoicingEntry[];
  selectedWeekStart: Date;
  loading: boolean;
  onGetOrCreateEntry: (creatorId: string, modelName: string, weekStart: Date) => Promise<CreatorInvoicingEntry | null>;
  onUpdateEntry: (creatorId: string, weekStartStr: string, field: keyof CreatorInvoicingEntry, value: any) => Promise<boolean>;
  onUpdatePercentageForward: (creatorId: string, fromWeekStartStr: string, newPercentage: number) => Promise<boolean>;
  onUpdateDefaultInvoiceNumber: (creatorId: string, invoiceNumber: number) => Promise<boolean>;
}

interface EditingCell {
  creatorId: string;
  field: string;
}

export function InvoiceComputationTable({
  creators,
  invoicingData,
  previousWeekData,
  selectedWeekStart,
  loading,
  onGetOrCreateEntry,
  onUpdateEntry,
  onUpdatePercentageForward,
  onUpdateDefaultInvoiceNumber,
}: InvoiceComputationTableProps) {
  const [entries, setEntries] = useState<Map<string, CreatorInvoicingEntry>>(new Map());
  const [prevEntries, setPrevEntries] = useState<Map<string, CreatorInvoicingEntry[]>>(new Map());
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [initializingCreators, setInitializingCreators] = useState<Set<string>>(new Set());
  const [modalCreator, setModalCreator] = useState<Creator | null>(null);
  const [conversionModalCreator, setConversionModalCreator] = useState<Creator | null>(null);

  const weekStartStr = format(selectedWeekStart, 'yyyy-MM-dd');
  const weekEnd = getWeekEnd(selectedWeekStart);
  const dueDate = addDays(weekEnd, 1);

  // Build entries map from invoicingData
  useEffect(() => {
    const map = new Map<string, CreatorInvoicingEntry>();
    invoicingData
      .filter(entry => entry.week_start_date === weekStartStr)
      .forEach(entry => {
        map.set(entry.creator_id, entry);
      });
    setEntries(map);
  }, [invoicingData, weekStartStr]);

  // Build previous entries map (now contains ALL historical data, grouped by creator)
  useEffect(() => {
    const map = new Map<string, CreatorInvoicingEntry[]>();
    // Group all historical entries by creator_id
    previousWeekData.forEach(entry => {
      const existing = map.get(entry.creator_id) || [];
      existing.push(entry);
      map.set(entry.creator_id, existing);
    });
    // Sort each creator's entries by week_start_date ascending
    map.forEach((entries, creatorId) => {
      entries.sort((a, b) => a.week_start_date.localeCompare(b.week_start_date));
    });
    setPrevEntries(map as any);
  }, [previousWeekData]);

  // Initialize entries for creators that don't have one
  const initializeEntry = async (creator: Creator) => {
    if (entries.has(creator.id) || initializingCreators.has(creator.id)) return;

    setInitializingCreators(prev => new Set(prev).add(creator.id));
    await onGetOrCreateEntry(creator.id, creator.model_name || creator.name, selectedWeekStart);
    setInitializingCreators(prev => {
      const next = new Set(prev);
      next.delete(creator.id);
      return next;
    });
  };

  // Ensure all creators have an entry for the selected week
  useEffect(() => {
    if (!creators.length) return;

    const missing = creators.filter(
      (c) => !entries.has(c.id) && !initializingCreators.has(c.id)
    );
    if (missing.length === 0) return;

    let cancelled = false;

    const run = async () => {
      const queue = [...missing];
      const concurrency = Math.min(5, queue.length);

      const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length > 0 && !cancelled) {
          const creator = queue.shift();
          if (!creator) break;
          await initializeEntry(creator);
        }
      });

      await Promise.all(workers);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [creators, entries, initializingCreators, selectedWeekStart]);


  // Get entry for a creator
  const getEntry = (creatorId: string): CreatorInvoicingEntry | undefined => {
    return entries.get(creatorId);
  };

  // Get all historical entries for a creator (sorted ascending by date)
  const getHistoricalEntries = (creatorId: string): CreatorInvoicingEntry[] => {
    return prevEntries.get(creatorId) || [];
  };

  // Handle checkbox change
  const handleCheckboxChange = async (creatorId: string, checked: boolean) => {
    const entry = getEntry(creatorId);
    if (!entry) {
      const creator = creators.find(c => c.id === creatorId);
      if (creator) {
        await initializeEntry(creator);
      }
      return;
    }
    await onUpdateEntry(creatorId, weekStartStr, 'invoice_payment', checked);
  };

  // Handle starting edit
  const handleStartEdit = async (creatorId: string, field: string, currentValue: any) => {
    const entry = getEntry(creatorId);
    if (!entry) {
      const creator = creators.find(c => c.id === creatorId);
      if (creator) {
        await initializeEntry(creator);
      }
      return;
    }
    setEditingCell({ creatorId, field });
    setEditValue(currentValue?.toString() || '');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingCell) return;

    const { creatorId, field } = editingCell;
    let value: any = editValue;

    // Convert to appropriate type
    if (field === 'paid' || field === 'net_sales' || field === 'percentage') {
      value = editValue === '' ? null : parseFloat(editValue);
      if (value !== null && isNaN(value)) {
        setEditingCell(null);
        return;
      }
    } else if (field === 'invoice_number') {
      value = editValue === '' ? null : parseInt(editValue, 10);
      if (value !== null && isNaN(value)) {
        setEditingCell(null);
        return;
      }
    }

    // Handle percentage update (forwards only)
    if (field === 'percentage' && value !== null) {
      await onUpdatePercentageForward(creatorId, weekStartStr, value);
    } else {
      await onUpdateEntry(creatorId, weekStartStr, field as keyof CreatorInvoicingEntry, value);
    }

    setEditingCell(null);
    setEditValue('');
  };

  // Handle key press in edit input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Calculate cumulative balance from all historical weeks
  // Iterates through all past weeks and computes running balance
  // Balance = sum of (paid - actualInvoice) for each week
  // where actualInvoice = baseAmount - previousCumulativeBalance
  const calculatePreviousWeekBalance = (creatorId: string): number => {
    const historicalEntries = getHistoricalEntries(creatorId);
    if (historicalEntries.length === 0) return 0;
    
    // Calculate cumulative balance by iterating through all historical weeks
    let cumulativeBalance = 0;
    
    for (const entry of historicalEntries) {
      const baseAmount = entry.net_sales !== null 
        ? (entry.net_sales * (entry.percentage / 100))
        : 0;
      
      // The actual invoice for this historical week includes the balance from before it
      const actualInvoice = baseAmount - cumulativeBalance;
      const paid = entry.paid ?? 0;
      
      // Update cumulative balance: paid - actualInvoice
      // Positive = overpaid (credit), Negative = underpaid (owed)
      cumulativeBalance = paid - actualInvoice;
    }
    
    return cumulativeBalance;
  };

  // Calculate invoice amount from net_sales, percentage, and balance from last week
  // Balance = paid - invoice (positive = overpaid/credit, negative = underpaid/remaining balance)
  // Formula: base - balance
  // - Overpaid (+balance): invoice = base - positive = DECREASED (model gets discount)
  // - Underpaid (-balance): invoice = base - negative = INCREASED (model owes more)
  const calculateInvoiceAmount = (entry: CreatorInvoicingEntry | undefined, creatorId: string): number | null => {
    if (!entry || entry.net_sales === null) return null;
    
    const baseAmount = entry.net_sales * (entry.percentage / 100);
    const previousBalance = calculatePreviousWeekBalance(creatorId);
    
    return baseAmount - previousBalance;
  };

  // Handle PDF download - opens conversion rate modal first
  const handleDownloadPdf = (creator: Creator) => {
    const entry = getEntry(creator.id);
    if (!entry) return;
    setConversionModalCreator(creator);
  };

  // Calculate base amount (before balance adjustment)
  const calculateBaseAmount = (entry: CreatorInvoicingEntry | undefined): number | null => {
    if (!entry || entry.net_sales === null) return null;
    return entry.net_sales * (entry.percentage / 100);
  };

  // Actually generate PDF with conversion rate
  const handleGeneratePdfWithConversion = (conversionRate: number | null) => {
    if (!conversionModalCreator) return;
    
    const entry = getEntry(conversionModalCreator.id);
    if (!entry) return;

    const invoiceAmount = calculateInvoiceAmount(entry, conversionModalCreator.id);
    const baseAmount = calculateBaseAmount(entry);
    const previousBalance = calculatePreviousWeekBalance(conversionModalCreator.id);

    generateInvoicePdf({
      creator: conversionModalCreator,
      entry,
      weekStart: selectedWeekStart,
      invoiceAmount,
      baseAmount,
      previousBalance,
      conversionRate,
    });
    
    setConversionModalCreator(null);
  };

  // Handle modal update
  const handleModalUpdate = async (updates: Partial<CreatorInvoicingEntry>) => {
    if (!modalCreator) return;
    
    for (const [field, value] of Object.entries(updates)) {
      await onUpdateEntry(modalCreator.id, weekStartStr, field as keyof CreatorInvoicingEntry, value);
    }
  };

  // Sort creators by default_invoice_number (nulls last)
  const sortedCreators = [...creators].sort((a, b) => {
    const numA = a.default_invoice_number ?? Infinity;
    const numB = b.default_invoice_number ?? Infinity;
    return numA - numB;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px] whitespace-nowrap text-center"># (Invoice)</TableHead>
              <TableHead className="min-w-[150px] whitespace-nowrap text-center">Model Name</TableHead>
              <TableHead className="w-[100px] whitespace-nowrap text-center">Invoice Payment</TableHead>
              <TableHead className="w-[100px] whitespace-nowrap text-center">Percentage (%)</TableHead>
              <TableHead className="w-[120px] whitespace-nowrap text-center">Net Sales ($)</TableHead>
              <TableHead className="w-[120px] whitespace-nowrap text-center">Invoice Amount ($)</TableHead>
              <TableHead className="w-[120px] whitespace-nowrap text-center">Paid ($)</TableHead>
              <TableHead className="w-[180px] whitespace-nowrap text-center">Invoice Link</TableHead>
              <TableHead className="w-[150px] whitespace-nowrap text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCreators.map((creator) => {
              const entry = getEntry(creator.id);
              const isInitializing = initializingCreators.has(creator.id);
              const invoiceAmount = calculateInvoiceAmount(entry, creator.id);
              const previousBalance = calculatePreviousWeekBalance(creator.id);
              const displayInvoiceNumber = formatInvoiceNumber(dueDate, creator.default_invoice_number);

              return (
                <TableRow 
                  key={creator.id}
                  className="hover:bg-muted/30"
                >
                  {/* Invoice Number (display format: DueDate-ModelNumber) */}
                  <TableCell className="font-mono text-sm">
                    {displayInvoiceNumber}
                  </TableCell>

                  {/* Model Name */}
                  <TableCell className="font-medium">
                    {creator.model_name || creator.name}
                    {isInitializing && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}
                  </TableCell>

                  {/* Invoice Payment Checkbox - auto-set based on Paid column */}
                  <TableCell className="text-center">
                    <Checkbox
                      checked={entry?.paid != null && entry.paid > 0}
                      disabled={true}
                    />
                  </TableCell>

                  {/* Percentage */}
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleStartEdit(creator.id, 'percentage', entry?.percentage)}
                  >
                    {editingCell?.creatorId === creator.id && editingCell.field === 'percentage' ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="h-8 w-20"
                      />
                    ) : (
                      <span>{entry?.percentage ?? 50}%</span>
                    )}
                  </TableCell>

                  {/* Net Sales */}
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleStartEdit(creator.id, 'net_sales', entry?.net_sales)}
                  >
                    {editingCell?.creatorId === creator.id && editingCell.field === 'net_sales' ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="h-8 w-24"
                      />
                    ) : (
                      <span className={cn(entry?.net_sales != null && "text-foreground")}>
                        {entry?.net_sales != null ? `$${entry.net_sales.toFixed(2)}` : '-'}
                      </span>
                    )}
                  </TableCell>

                  {/* Invoice Amount (calculated, non-editable) */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-medium",
                        invoiceAmount != null && "text-brand-yellow"
                      )}>
                        {invoiceAmount != null ? `$${invoiceAmount.toFixed(2)}` : '-'}
                      </span>
                      {previousBalance !== 0 && entry?.net_sales !== null && (
                        <span className={cn(
                          "text-xs",
                          previousBalance > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {previousBalance > 0 ? `(-$${previousBalance.toFixed(2)} credit)` : `(+$${Math.abs(previousBalance).toFixed(2)} owed)`}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Paid Amount */}
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleStartEdit(creator.id, 'paid', entry?.paid)}
                  >
                    {editingCell?.creatorId === creator.id && editingCell.field === 'paid' ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="h-8 w-24"
                      />
                    ) : (
                      <span className={cn(entry?.paid != null && "text-foreground")}>
                        {entry?.paid != null ? `$${entry.paid.toFixed(2)}` : '-'}
                      </span>
                    )}
                  </TableCell>

                  {/* Invoice Link */}
                  <TableCell
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleStartEdit(creator.id, 'invoice_link', entry?.invoice_link)}
                  >
                    {editingCell?.creatorId === creator.id && editingCell.field === 'invoice_link' ? (
                      <Input
                        type="url"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        placeholder="https://..."
                        className="h-8"
                      />
                    ) : entry?.invoice_link ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(entry.invoice_link!, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">Click to add</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(creator)}
                        disabled={!entry}
                        title="Download Invoice PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModalCreator(creator)}
                        title="Update Week's Invoice"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {creators.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No creators found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Update Week Invoice Modal */}
      {modalCreator && (
        <UpdateWeekInvoiceModal
          isOpen={!!modalCreator}
          onClose={() => setModalCreator(null)}
          creator={modalCreator}
          entry={getEntry(modalCreator.id) ?? null}
          weekStart={selectedWeekStart}
          onUpdate={handleModalUpdate}
          onUpdateDefaultInvoiceNumber={onUpdateDefaultInvoiceNumber}
        />
      )}

      {/* Conversion Rate Modal for PDF Download */}
      <ConversionRateModal
        open={!!conversionModalCreator}
        onOpenChange={(open) => {
          if (!open) setConversionModalCreator(null);
        }}
        onConfirm={handleGeneratePdfWithConversion}
        invoiceAmountUsd={
          conversionModalCreator
            ? calculateInvoiceAmount(getEntry(conversionModalCreator.id), conversionModalCreator.id)
            : null
        }
      />
    </>
  );
}
