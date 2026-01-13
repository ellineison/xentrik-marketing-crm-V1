import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { format, addDays, getYear, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreatorInvoicingEntry, WeekCutoff } from './types';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const MODELS_PER_PAGE = 10;
const CURRENT_YEAR = 2026; // Starting year for due dates

interface InvoiceChecklistProps {
  creators: { id: string; name: string; model_name: string | null }[];
  generateWeekCutoffs: (count?: number, direction?: 'past' | 'future' | 'full-year') => WeekCutoff[];
  fetchInvoicingDataRange: (weeks: WeekCutoff[]) => Promise<CreatorInvoicingEntry[]>;
}

export function InvoiceChecklist({
  creators,
  generateWeekCutoffs,
  fetchInvoicingDataRange,
}: InvoiceChecklistProps) {
  const [allWeeks, setAllWeeks] = useState<WeekCutoff[]>([]);
  const [invoicingData, setInvoicingData] = useState<CreatorInvoicingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelPage, setModelPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  // Get available years from weeks
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allWeeks.forEach(week => {
      years.add(getYear(week.dueDate));
    });
    return Array.from(years).sort();
  }, [allWeeks]);

  // Filter weeks by selected year
  const weeksForYear = useMemo(() => {
    return allWeeks.filter(week => getYear(week.dueDate) === selectedYear);
  }, [allWeeks, selectedYear]);

  // Paginated creators
  const totalModelPages = Math.ceil(creators.length / MODELS_PER_PAGE);
  const paginatedCreators = useMemo(() => {
    const startIndex = (modelPage - 1) * MODELS_PER_PAGE;
    return creators.slice(startIndex, startIndex + MODELS_PER_PAGE);
  }, [creators, modelPage]);

  const loadData = useCallback(async () => {
    setLoading(true);
    // Generate weeks for full years (2026, 2027, 2028)
    const weekCutoffs = generateWeekCutoffs(0, 'full-year');
    setAllWeeks(weekCutoffs);
    
    const data = await fetchInvoicingDataRange(weekCutoffs);
    setInvoicingData(data);
    setLoading(false);
  }, [generateWeekCutoffs, fetchInvoicingDataRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get entry for a creator and week
  const getEntry = (creatorId: string, weekStartStr: string): CreatorInvoicingEntry | undefined => {
    return invoicingData.find(
      entry => entry.creator_id === creatorId && entry.week_start_date === weekStartStr
    );
  };

  // Get previous week entry for a creator
  const getPreviousWeekEntry = (creatorId: string, weekIndex: number): CreatorInvoicingEntry | undefined => {
    if (weekIndex === 0) return undefined; // No previous week for first column
    
    const prevWeek = weeksForYear[weekIndex - 1];
    if (!prevWeek) return undefined;
    
    return getEntry(creatorId, format(prevWeek.weekStart, 'yyyy-MM-dd'));
  };

  // Calculate carry over from previous week (using weeksForYear)
  const calculateCarryOver = (creatorId: string, weekIndex: number): number | null => {
    const prevEntry = getPreviousWeekEntry(creatorId, weekIndex);
    
    if (!prevEntry || prevEntry.net_sales === null) return null;
    
    const invoiceAmount = prevEntry.net_sales * (prevEntry.percentage / 100);
    const paidAmount = prevEntry.paid ?? 0;
    
    // Difference: positive = overpaid (carry over credit), negative = underpaid (debt)
    const difference = paidAmount - invoiceAmount;
    
    // Only return if there's a significant difference (not equal)
    if (Math.abs(difference) < 0.01) return null;
    
    return difference;
  };

  // Check if previous week's invoice was paid (paid column has value > 0)
  const isPreviousWeekPaid = (creatorId: string, weekIndex: number): boolean => {
    const prevEntry = getPreviousWeekEntry(creatorId, weekIndex);
    return prevEntry?.paid != null && prevEntry.paid > 0;
  };

  // Render cell content
  const renderCellContent = (creatorId: string, weekIndex: number) => {
    const week = weeksForYear[weekIndex];
    if (!week) return null;
    
    const carryOver = calculateCarryOver(creatorId, weekIndex);
    const prevWeekPaid = isPreviousWeekPaid(creatorId, weekIndex);

    // If there's a carry over from previous week, show credit/owed with background
    if (carryOver !== null && Math.abs(carryOver) >= 0.01) {
      const isCredit = carryOver > 0;
      return (
        <div
          className={cn(
            "px-2 py-1 rounded text-center font-medium text-sm",
            isCredit ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-red-500/20 text-red-600 dark:text-red-400"
          )}
        >
          ${Math.abs(carryOver).toFixed(0)}
        </div>
      );
    }

    // If previous week's invoice was paid (paid column has value), show check
    if (prevWeekPaid) {
      return (
        <div className="flex items-center justify-center">
          <Check className="h-5 w-5 text-green-500" />
        </div>
      );
    }

    // Not paid or no data
    return (
      <div className="text-muted-foreground text-center">-</div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Due Date Year:</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedYear(prev => prev - 1)}
              disabled={!availableYears.includes(selectedYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 font-semibold min-w-[60px] text-center">{selectedYear}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedYear(prev => prev + 1)}
              disabled={!availableYears.includes(selectedYear + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Model Pagination Info */}
        <div className="text-sm text-muted-foreground">
          Showing {paginatedCreators.length} of {creators.length} models
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[150px] sticky left-0 bg-muted/50 z-10">Model Name</TableHead>
                {weeksForYear.map((week, index) => (
                  <TableHead key={index} className="min-w-[100px] text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground">Due:</span>
                      <span>{format(week.dueDate, 'MMM d')}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCreators.map((creator) => (
                <TableRow key={creator.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {creator.model_name || creator.name}
                  </TableCell>
                  {weeksForYear.map((week, weekIndex) => (
                    <TableCell key={weekIndex} className="text-center p-2">
                      {renderCellContent(creator.id, weekIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {paginatedCreators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={weeksForYear.length + 1} className="text-center text-muted-foreground py-8">
                    No creators found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Paid</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-5 rounded bg-green-500/20 flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">$50</div>
                <span>Overpayment (credit carry-over)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-5 rounded bg-red-500/20 flex items-center justify-center text-xs font-medium text-red-600 dark:text-red-400">$10</div>
                <span>Underpayment (debt carry-over)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">-</span>
                <span>Not paid / No data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Pagination */}
      {totalModelPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setModelPage(prev => Math.max(1, prev - 1))}
                  className={cn(modelPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: totalModelPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setModelPage(page)}
                    isActive={modelPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setModelPage(prev => Math.min(totalModelPages, prev + 1))}
                  className={cn(modelPage === totalModelPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
