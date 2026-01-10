import React, { useState, useMemo, useTransition } from 'react';
import { PremiumCard } from '@/components/ui/premium-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import CustomCard from './CustomCard';
import CustomDetailsModal from './details/CustomDetailsModal';
import DoneModal from './DoneModal';
import EndorsedModal from './EndorsedModal';
import { Custom } from '@/types/custom';

interface KanbanBoardProps {
  customs: Custom[];
  onUpdateStatus: (data: { customId: string; newStatus: string; chatterName?: string; endorserName?: string }) => void;
  onUpdateDownpayment?: (customId: string, newDownpayment: number) => void;
  onDeleteCustom?: (customId: string) => void;
  isUpdating: boolean;
}

const COLUMNS = [
  { id: 'partially_paid', title: 'Partially Paid', color: 'bg-yellow-500/20 border-yellow-500/30' },
  { id: 'fully_paid', title: 'Fully Paid', color: 'bg-blue-500/20 border-blue-500/30' },
  { id: 'endorsed', title: 'Endorsed', color: 'bg-purple-500/20 border-purple-500/30' },
  { id: 'done', title: 'Done', color: 'bg-green-500/20 border-green-500/30' },
  { id: 'refunded', title: 'Refunded', color: 'bg-red-500/20 border-red-500/30' }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  customs, 
  onUpdateStatus, 
  onUpdateDownpayment,
  onDeleteCustom,
  isUpdating 
}) => {
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [endorsedModalOpen, setEndorsedModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCustom, setSelectedCustom] = useState<Custom | null>(null);
  const [draggedCustom, setDraggedCustom] = useState<Custom | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDragStart = (e: React.DragEvent, custom: Custom) => {
    setDraggedCustom(custom);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedCustom && draggedCustom.status !== columnId) {
      setHoveredColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear hover state if leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setHoveredColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedCustom || draggedCustom.status === newStatus) {
      setHoveredColumn(null);
      setDraggedCustom(null);
      return;
    }

    const droppedCustom = draggedCustom;

    // Immediately open modal without waiting for re-renders
    if (newStatus === 'done') {
      setSelectedCustom(droppedCustom);
      setDoneModalOpen(true);
      // Defer non-critical state updates
      startTransition(() => {
        setHoveredColumn(null);
        setDraggedCustom(null);
      });
    } else if (newStatus === 'endorsed') {
      setSelectedCustom(droppedCustom);
      setEndorsedModalOpen(true);
      // Defer non-critical state updates
      startTransition(() => {
        setHoveredColumn(null);
        setDraggedCustom(null);
      });
    } else {
      startTransition(() => {
        setHoveredColumn(null);
        setDraggedCustom(null);
      });
      onUpdateStatus({ customId: droppedCustom.id, newStatus });
    }
  };

  const handleCardClick = (custom: Custom) => {
    setSelectedCustom(custom);
    setDetailsModalOpen(true);
  };

  const handleDoneConfirm = (chatterName: string) => {
    if (selectedCustom) {
      onUpdateStatus({ 
        customId: selectedCustom.id, 
        newStatus: 'done', 
        chatterName 
      });
    }
    setDoneModalOpen(false);
    setSelectedCustom(null);
  };

  const handleEndorsedConfirm = (endorserName: string) => {
    if (selectedCustom) {
      onUpdateStatus({ 
        customId: selectedCustom.id, 
        newStatus: 'endorsed', 
        endorserName 
      });
    }
    setEndorsedModalOpen(false);
    setSelectedCustom(null);
  };

  const getCustomsByStatus = useMemo(() => {
    return (status: string) => customs.filter(custom => custom.status === status);
  }, [customs]);

  const getColumnStyles = (columnId: string, baseColor: string) => {
    if (hoveredColumn === columnId && draggedCustom) {
      // Enhanced visual feedback when hovering during drag
      return `${baseColor} ring-2 ring-brand-yellow ring-opacity-50 bg-opacity-40 scale-[1.02] transition-all duration-200`;
    }
    return baseColor;
  };

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 h-full pb-4" style={{ display: 'flex', width: '100%' }}>
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col h-full" style={{ flex: '1 1 0%', minWidth: '380px' }}>
              <PremiumCard className={`flex-1 ${getColumnStyles(column.id, column.color)}`}>
                <div className="p-2 border-b border-border/20">
                  <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {getCustomsByStatus(column.id).length} items
                  </span>
                </div>
                
                <div
                  className="flex-1 p-2 space-y-2 overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {getCustomsByStatus(column.id).map((custom) => (
                    <div key={custom.id}>
                      <CustomCard
                        custom={custom}
                        onDragStart={handleDragStart}
                        onClick={handleCardClick}
                        isDragging={draggedCustom?.id === custom.id}
                        isUpdating={isUpdating}
                      />
                    </div>
                  ))}
                  
                  {getCustomsByStatus(column.id).length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-xs">
                      No customs in this stage
                    </div>
                  )}
                </div>
              </PremiumCard>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <CustomDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCustom(null);
        }}
        custom={selectedCustom}
        onUpdateStatus={onUpdateStatus}
        onUpdateDownpayment={onUpdateDownpayment}
        onDeleteCustom={onDeleteCustom}
        isUpdating={isUpdating}
      />

      <DoneModal
        isOpen={doneModalOpen}
        onClose={() => {
          setDoneModalOpen(false);
          setSelectedCustom(null);
        }}
        onConfirm={handleDoneConfirm}
        custom={selectedCustom}
      />

      <EndorsedModal
        isOpen={endorsedModalOpen}
        onClose={() => {
          setEndorsedModalOpen(false);
          setSelectedCustom(null);
        }}
        onConfirm={handleEndorsedConfirm}
        custom={selectedCustom}
      />
    </>
  );
};

export default KanbanBoard;
