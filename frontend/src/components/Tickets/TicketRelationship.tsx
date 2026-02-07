import { FiLink2, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Card from '../common/Card';

interface TicketRelationshipProps {
  parentTicket?: {
    id: string;
    ticketNumber: string;
    title: string;
  };
  childTickets?: Array<{
    id: string;
    ticketNumber: string;
    title: string;
  }>;
}

export default function TicketRelationship({
  parentTicket,
  childTickets
}: TicketRelationshipProps) {
  if (!parentTicket && (!childTickets || childTickets.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Ticket Padre */}
      {parentTicket && (
        <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Este es un ticket de seguimiento
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-700 dark:text-blue-300">
                  Ticket original:
                </span>
                <Link
                  to={`/tickets/${parentTicket.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FiLink2 className="w-3 h-3" />
                  <span className="font-mono font-medium">{parentTicket.ticketNumber}</span>
                </Link>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 line-clamp-1">
                {parentTicket.title}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tickets Hijos */}
      {childTickets && childTickets.length > 0 && (
        <Card padding="md" className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                {childTickets.length === 1
                  ? 'Se creó un ticket de seguimiento'
                  : `Se crearon ${childTickets.length} tickets de seguimiento`}
              </p>
              <div className="space-y-2">
                {childTickets.map((child) => (
                  <div key={child.id} className="flex items-center gap-2 text-sm">
                    <FiArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <Link
                      to={`/tickets/${child.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      <FiLink2 className="w-3 h-3" />
                      <span className="font-mono font-medium">{child.ticketNumber}</span>
                    </Link>
                    <span className="text-xs text-orange-600 dark:text-orange-400 line-clamp-1 flex-1">
                      {child.title}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Este ticket se cerró por exceder el límite de rechazos de entregables.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
