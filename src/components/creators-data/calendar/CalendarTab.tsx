import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedules } from './useSchedules';
import CalendarGrid from './CalendarGrid';
import ScheduleFormModal from './ScheduleFormModal';
import ScheduleDetailsModal from './ScheduleDetailsModal';
import { Schedule, ScheduleFormData } from './types';

interface CalendarTabProps {
  creatorId: string;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ creatorId }) => {
  const { userRole, userRoles } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');

  const {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSchedules(creatorId);

  // Clean up pointer-events when modals close
  useEffect(() => {
    if (!showFormModal && !showDetailsModal) {
      document.body.style.pointerEvents = '';
    }
  }, [showFormModal, showDetailsModal]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    if (isAdmin) {
      setSelectedDate(date);
      setSelectedSchedule(null);
      setShowFormModal(true);
    }
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailsModal(true);
  };

  const handleFormSubmit = (formData: ScheduleFormData) => {
    if (selectedSchedule) {
      updateSchedule(
        { id: selectedSchedule.id, formData },
        {
          onSuccess: () => {
            setShowFormModal(false);
            setSelectedSchedule(null);
          },
        }
      );
    } else {
      createSchedule(formData, {
        onSuccess: () => {
          setShowFormModal(false);
          setSelectedDate(undefined);
        },
      });
    }
  };

  const handleEdit = () => {
    setShowDetailsModal(false);
    setShowFormModal(true);
  };

  const handleDelete = () => {
    if (selectedSchedule) {
      deleteSchedule(selectedSchedule.id, {
        onSuccess: () => {
          setShowDetailsModal(false);
          setSelectedSchedule(null);
        },
      });
    }
  };

  if (!creatorId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load calendar: Creator ID not found.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Model Calendar</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedSchedule(null);
                setSelectedDate(new Date());
                setShowFormModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        currentDate={currentDate}
        schedules={schedules}
        onDayClick={handleDayClick}
        onScheduleClick={handleScheduleClick}
      />

      {/* Legend */}
      <div className="text-xs text-muted-foreground">
        {isAdmin ? (
          <p>Click on a day to add a schedule, or click on an existing schedule to view/edit.</p>
        ) : (
          <p>Click on a schedule to view its details.</p>
        )}
      </div>

      {/* Form Modal */}
      <ScheduleFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        schedule={selectedSchedule}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
        selectedDate={selectedDate}
      />

      {/* Details Modal */}
      <ScheduleDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        schedule={selectedSchedule}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={isAdmin}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CalendarTab;
