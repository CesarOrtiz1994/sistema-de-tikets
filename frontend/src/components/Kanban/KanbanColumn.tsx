import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType } from '../../services/kanban.service';
import SortableTicketCard from './SortableTicketCard';
import Badge from '../common/Badge';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onTicketClick?: (ticketId: string) => void;
}

const COLUMN_COLORS = {
  NEW: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  ASSIGNED: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  IN_PROGRESS: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  WAITING: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  RESOLVED: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
};

export default function KanbanColumn({ column, onTicketClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.status
  });

  const ticketIds = column.tickets.map(ticket => ticket.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header de la columna */}
      <div className={`
        rounded-t-lg p-4 border-t-4 border-x border-b
        ${COLUMN_COLORS[column.status]}
      `}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {column.label}
          </h3>
          <Badge variant="gray" size="sm">
            {column.count}
          </Badge>
        </div>
      </div>

      {/* Área de drop para tickets */}
      <div
        ref={setNodeRef}
        className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg p-3 space-y-3 min-h-[200px] overflow-y-auto"
      >
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {column.tickets.map((ticket) => (
            <SortableTicketCard 
              key={ticket.id} 
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket.id)}
            />
          ))}
        </SortableContext>

        {column.tickets.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">
            No hay tickets
          </div>
        )}
      </div>
    </div>
  );
}
