import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useSalesData } from './hooks/useSalesData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PayChatterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PayChatterDialog: React.FC<PayChatterDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { salesData, models } = useSalesData();

  const getWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    const thursday = new Date(today);
    
    if (dayOfWeek < 4) {
      thursday.setDate(today.getDate() - (7 - daysUntilThursday));
    } else {
      thursday.setDate(today.getDate() - daysUntilThursday);
    }
    
    return thursday.toISOString().split('T')[0];
  };

  const generatePDF = async (): Promise<void> => {
    // Import jsPDF dynamically to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const weekStart = getWeekStartDate();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Title
    doc.setFontSize(20);
    doc.text('Weekly Sales Report', 20, 30);
    
    // Week period
    doc.setFontSize(12);
    doc.text(`Week: ${weekStart} to ${weekEnd.toISOString().split('T')[0]}`, 20, 45);
    
    // Table headers
    const days = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    let yPos = 70;
    
    // Header row
    doc.setFontSize(10);
    doc.text('Model', 20, yPos);
    days.forEach((day, index) => {
      doc.text(day, 50 + (index * 20), yPos);
    });
    doc.text('Total', 190, yPos);
    
    yPos += 10;
    
    // Data rows
    models.forEach(model => {
      doc.text(model.model_name, 20, yPos);
      
      let modelTotal = 0;
      days.forEach((_, dayIndex) => {
        const entry = salesData.find(s => 
          s.model_name === model.model_name && s.day_of_week === dayIndex
        );
        const earnings = entry?.earnings || 0;
        modelTotal += earnings;
        doc.text(`$${earnings.toFixed(2)}`, 50 + (dayIndex * 20), yPos);
      });
      
      doc.text(`$${modelTotal.toFixed(2)}`, 190, yPos);
      yPos += 8;
    });
    
    // Daily totals
    yPos += 5;
    doc.text('Daily Total:', 20, yPos);
    let weeklyTotal = 0;
    
    days.forEach((_, dayIndex) => {
      const dayTotal = models.reduce((total, model) => {
        const entry = salesData.find(s => 
          s.model_name === model.model_name && s.day_of_week === dayIndex
        );
        return total + (entry?.earnings || 0);
      }, 0);
      weeklyTotal += dayTotal;
      doc.text(`$${dayTotal.toFixed(2)}`, 50 + (dayIndex * 20), yPos);
    });
    
    doc.text(`$${weeklyTotal.toFixed(2)}`, 190, yPos);
    
    // Save the PDF
    doc.save(`sales-report-${weekStart}.pdf`);
  };

  const clearWeekData = async (): Promise<void> => {
    const weekStartDate = getWeekStartDate();
    
    const { error } = await supabase
      .from('sales_tracker')
      .delete()
      .eq('week_start_date', weekStartDate);
      
    if (error) {
      throw error;
    }
  };

  const handlePayChatter = async () => {
    setIsLoading(true);
    try {
      // Generate PDF only - do not clear data
      await generatePDF();
      
      toast({
        title: "Success",
        description: "Sales report saved as PDF successfully."
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Pay Chatter - End Week
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This action will:
          </p>
          
          <ul className="text-sm space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Save the current week's sales data as a PDF report
            </li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This will only generate a PDF report. Your sales data will remain intact and uneditable.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayChatter}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Generating...' : 'Generate PDF Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};