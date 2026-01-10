import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { Schedule } from './types';

interface ScheduleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  isDeleting: boolean;
}

const ScheduleDetailsModal: React.FC<ScheduleDetailsModalProps> = ({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onDelete,
  canEdit,
  isDeleting,
}) => {
  if (!schedule) return null;

  const startDate = parseISO(schedule.start_time);
  const endDate = parseISO(schedule.end_time);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      onDelete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: schedule.color }}
            />
            <DialogTitle className="text-lg">{schedule.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              {schedule.all_day ? (
                <div>
                  <p className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
                  {format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd') && (
                    <p className="text-sm text-muted-foreground">
                      to {format(endDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">All day</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {schedule.description && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {schedule.description}
              </p>
            </div>
          )}
        </div>

        {canEdit && (
          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailsModal;
