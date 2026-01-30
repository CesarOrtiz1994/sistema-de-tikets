import { FiClock, FiUser, FiAlertCircle, FiPauseCircle } from 'react-icons/fi';
import Badge from '../common/Badge';
import { KanbanTicket } from '../../services/kanban.service';
import { BadgeVariant } from '../common/Badge';

interface TicketCardProps {
  ticket: KanbanTicket;
  isDragging?: boolean;
  onClick?: () => void;
}

const PRIORITY_CONFIG = {
  LOW: { variant: 'success' as BadgeVariant, label: 'Bajo' },
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

const formatTimeRemaining = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const getSLAStatus = (ticket: KanbanTicket): 'exceeded' | 'warning' | 'ok' | 'paused' | null => {
  // Si está pausado (WAITING)
  if (ticket.slaPausedAt) {
    return 'paused';
  }
  
  // Si ya excedió el SLA
  if (ticket.slaExceeded) {
    return 'exceeded';
  }
  
  // Si no tiene deadline, no hay SLA
  if (!ticket.slaDeadline) {
    return null;
  }
  
  const now = new Date().getTime();
  const deadline = new Date(ticket.slaDeadline).getTime();
  const timeRemaining = deadline - now;
  
  // Si ya pasó el deadline
  if (timeRemaining < 0) {
    return 'exceeded';
  }
  
  // Si quedan menos de 30 minutos
  if (timeRemaining < 30 * 60 * 1000) {
    return 'warning';
  }
  
  return 'ok';
};

export default function TicketCard({ ticket, isDragging, onClick }: TicketCardProps) {
  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const slaStatus = getSLAStatus(ticket);
  
  // Calcular tiempo restante para mostrar
  let timeRemainingText = '';
  if (ticket.slaDeadline && !ticket.slaExceeded && !ticket.slaPausedAt) {
    const now = new Date().getTime();
    const deadline = new Date(ticket.slaDeadline).getTime();
    const timeRemaining = deadline - now;
    if (timeRemaining > 0) {
      timeRemainingText = formatTimeRemaining(timeRemaining);
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        hover:shadow-md transition-shadow cursor-pointer overflow-hidden
        ${isDragging ? 'opacity-50 rotate-2' : ''}
      `}
    >
      {/* Barra de estado SLA en la parte superior */}
      {slaStatus && (
        <div className={`h-1 w-full ${
          slaStatus === 'exceeded' ? 'bg-red-500' :
          slaStatus === 'warning' ? 'bg-yellow-500' :
          slaStatus === 'paused' ? 'bg-gray-400' :
          'bg-green-500'
        }`} />
      )}
      
      <div className="p-4">
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
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {ticket.title}
      </h4>
      
      {/* Badge de SLA */}
      {slaStatus && slaStatus !== 'ok' && (
        <div className="mb-3">
          {slaStatus === 'exceeded' && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
              <FiAlertCircle className="w-3 h-3" />
              <span className="font-semibold">SLA Excedido</span>
            </div>
          )}
          {slaStatus === 'warning' && timeRemainingText && (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs">
              <FiClock className="w-3 h-3" />
              <span className="font-semibold">Quedan {timeRemainingText}</span>
            </div>
          )}
          {slaStatus === 'paused' && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
              <FiPauseCircle className="w-3 h-3" />
              <span className="font-semibold">SLA Pausado</span>
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}
