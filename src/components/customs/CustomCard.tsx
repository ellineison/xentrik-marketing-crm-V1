
import React from 'react';
import { PremiumCard } from '@/components/ui/premium-card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, AlertTriangle, Paperclip } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { Custom } from '@/types/custom';

interface CustomCardProps {
  custom: Custom;
  onDragStart: (e: React.DragEvent, custom: Custom) => void;
  onClick: (custom: Custom) => void;
  isDragging: boolean;
  isUpdating: boolean;
}

const CustomCard: React.FC<CustomCardProps> = ({ 
  custom, 
  onDragStart, 
  onClick,
  isDragging, 
  isUpdating 
}) => {
  // Handle optional due date - only check for overdue if due_date exists
  const isOverdue = custom.due_date ? isAfter(new Date(), parseISO(custom.due_date)) : false;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(custom);
  };

  // Determine which team info to show based on status
  const getTeamInfoContent = () => {
    if (custom.status === 'done') {
      // Done cards show: Sold by and Sent by
      return (
        <>
          <span>Sold by: {custom.sale_by}</span>
          {custom.sent_by && <span className="ml-2">• Sent by: {custom.sent_by}</span>}
        </>
      );
    } else if (custom.status === 'endorsed') {
      // Endorsed cards show: Sold by and Endorsed by
      return (
        <>
          <span>Sold by: {custom.sale_by}</span>
          {custom.endorsed_by && <span className="ml-2">• Endorsed by: {custom.endorsed_by}</span>}
        </>
      );
    } else {
      // All other statuses show all fields
      return (
        <>
          <span>Sold by: {custom.sale_by}</span>
          {custom.endorsed_by && <span className="ml-2">• Endorsed by: {custom.endorsed_by}</span>}
          {custom.sent_by && <span className="ml-2">• Sent by: {custom.sent_by}</span>}
        </>
      );
    }
  };

  return (
    <PremiumCard
      className={`cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'
      } ${isOverdue ? 'border-red-500/50' : ''} ${
        isUpdating ? 'pointer-events-none opacity-70' : ''
      }`}
      draggable={!isUpdating}
      onDragStart={(e) => onDragStart(e, custom)}
      onClick={handleClick}
    >
      <div className="p-2 space-y-2">
        {/* Header with Model Name and Overdue Indicator */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-foreground dark:text-brand-yellow border-foreground dark:border-brand-yellow text-xs flex-shrink-0">
            {custom.model_name}
          </Badge>
          <div className="flex items-center gap-1 flex-shrink-0">
            {custom.attachments && custom.attachments.length > 0 && (
              <div className="flex items-center text-muted-foreground text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                {custom.attachments.length}
              </div>
            )}
            {isOverdue && (
              <div className="flex items-center text-red-400 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </div>
            )}
          </div>
        </div>

        {/* Fan Information */}
        <div className="flex items-center text-xs text-muted-foreground">
          <User className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="font-medium text-foreground truncate">{custom.fan_display_name}</span>
          {custom.fan_username && (
            <span className="ml-1 truncate">(@{custom.fan_username})</span>
          )}
        </div>

        {/* Custom Type - Single line with ellipsis */}
        <div>
          <p className="text-xs text-muted-foreground text-left truncate">
            {custom.custom_type || 'Custom type not specified'}
          </p>
        </div>

        {/* Payment Information - Removed Paid badge */}
        <div className="flex items-center text-xs">
          <div className="flex items-center text-muted-foreground flex-shrink-0">
            <span>
              {formatCurrency(custom.downpayment)} / {formatCurrency(custom.full_price)}
            </span>
          </div>
        </div>

        {/* Due Date - always show, with fallback text */}
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>
            {custom.due_date 
              ? format(parseISO(custom.due_date), 'MMM dd, yyyy')
              : 'Due Date not specified'
            }
          </span>
        </div>

        {/* Sale Information - Conditional based on status */}
        <div className="text-xs text-muted-foreground break-words">
          {getTeamInfoContent()}
        </div>
      </div>
    </PremiumCard>
  );
};

export default CustomCard;
