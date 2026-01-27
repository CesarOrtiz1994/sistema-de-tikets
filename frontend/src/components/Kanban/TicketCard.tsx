import { FiClock, FiUser } from 'react-icons/fi';
import Badge from '../common/Badge';
import { KanbanTicket } from '../../services/kanban.service';
import { BadgeVariant } from '../common/Badge';

interface TicketCardProps {
  ticket: KanbanTicket;
  isDragging?: boolean;
  onClick?: () => void;
}

const PRIORITY_CONFIG = {
  LOW: { variant: 'success' as BadgeVariant, label: 'Baja' },
  MEDIUM: { variant: 'warning' as BadgeVariant, label: 'Media' },
  HIGH: { variant: 'orange' as BadgeVariant, label: 'Alta' },
  CRITICAL: { variant: 'danger' as BadgeVariant, label: 'Crítica' }
};

const formatTimeInStatus = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h`;
};

export default function TicketCard({ ticket, isDragging, onClick }: TicketCardProps) {
  const priorityConfig = PRIORITY_CONFIG[ticket.priority];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700
        hover:shadow-md transition-shadow cursor-pointer
        ${isDragging ? 'opacity-50 rotate-2' : ''}
      `}
    >
      {/* Header: Número y Prioridad */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {ticket.ticketNumber}
        </span>
        <Badge variant={priorityConfig.variant} size="sm">
          {priorityConfig.label}
        </Badge>
      </div>

      {/* Título */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
        {ticket.title}
      </h4>

      {/* Footer: Avatar y Tiempo */}
      <div className="flex items-center justify-between">
        {/* Avatar del asignado */}
        <div className="flex items-center gap-2">
          {ticket.assignedTo ? (
            <>
              {ticket.assignedTo.profilePicture ? (
                <img
                  src={ticket.assignedTo.profilePicture}
                  alt={ticket.assignedTo.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                  {ticket.assignedTo.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                {ticket.assignedTo.name.split(' ')[0]}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <FiUser className="w-4 h-4" />
              <span className="text-xs">Sin asignar</span>
            </div>
          )}
        </div>

        {/* Tiempo en estado */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <FiClock className="w-3 h-3" />
          <span className="text-xs">{formatTimeInStatus(ticket.timeInStatus)}</span>
        </div>
      </div>
    </div>
  );
}
