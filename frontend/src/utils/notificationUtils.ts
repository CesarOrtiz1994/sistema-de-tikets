import { IconType } from 'react-icons';
import {
  FiPlus,
  FiUserCheck,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiStar,
  FiUpload,
  FiThumbsUp,
  FiThumbsDown,
  FiAlertOctagon,
  FiMessageSquare,
  FiBell,
  FiArrowUp,
} from 'react-icons/fi';

interface NotificationIconInfo {
  icon: IconType;
  color: string; // Tailwind bg + text classes
}

const iconMap: Record<string, NotificationIconInfo> = {
  TICKET_CREATED: {
    icon: FiPlus,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  TICKET_ASSIGNED: {
    icon: FiUserCheck,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  TICKET_STATUS_CHANGED: {
    icon: FiRefreshCw,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  TICKET_PRIORITY_CHANGED: {
    icon: FiArrowUp,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  TICKET_RESOLVED: {
    icon: FiCheckCircle,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  TICKET_CLOSED: {
    icon: FiXCircle,
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
  TICKET_REOPENED: {
    icon: FiRefreshCw,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  TICKET_CANCELLED: {
    icon: FiXCircle,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  TICKET_AUTO_CLOSED: {
    icon: FiClock,
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  },
  TICKET_RATED: {
    icon: FiStar,
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  DELIVERABLE_UPLOADED: {
    icon: FiUpload,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  DELIVERABLE_APPROVED: {
    icon: FiThumbsUp,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  DELIVERABLE_REJECTED: {
    icon: FiThumbsDown,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  DELIVERABLE_LIMIT_EXCEEDED: {
    icon: FiAlertOctagon,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  SLA_WARNING: {
    icon: FiAlertTriangle,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  SLA_EXCEEDED: {
    icon: FiAlertOctagon,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  NEW_MESSAGE: {
    icon: FiMessageSquare,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const defaultIcon: NotificationIconInfo = {
  icon: FiBell,
  color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export function getNotificationIcon(type: string): NotificationIconInfo {
  return iconMap[type] || defaultIcon;
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24) return `Hace ${diffHour}h`;
  if (diffDay === 1) return 'Ayer';
  if (diffDay < 7) return `Hace ${diffDay} días`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
