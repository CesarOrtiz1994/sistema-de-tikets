import { createElement } from 'react';
import {
  FiFileText, FiUserCheck, FiUserX, FiRefreshCw, FiAlertTriangle,
  FiEdit, FiCheckCircle, FiLock, FiUnlock, FiStar, FiMessageSquare,
  FiPaperclip, FiTrash2, FiPauseCircle, FiPlayCircle, FiAlertOctagon,
  FiClock, FiCpu, FiBriefcase, FiClipboard, FiPackage, FiXCircle,
  FiBell, FiMail, FiActivity
} from 'react-icons/fi';

/**
 * Traduce las acciones técnicas del historial a mensajes amigables para usuarios finales
 * TODOS los mensajes en español claro y conciso
 */
export const getHistoryMessage = (action: string, details?: any): string => {
  try {
    const detailsObj = typeof details === 'string' ? JSON.parse(details) : details || {};

    switch (action) {
      case 'CREATE_TICKET':
        return 'Ticket creado';

      case 'ASSIGN_TICKET':
      case 'ASSIGNED':
        if (detailsObj?.assignedTo) {
          return `Asignado a ${detailsObj.assignedTo}`;
        }
        if (detailsObj?.assignedToName) {
          return `Asignado a ${detailsObj.assignedToName}`;
        }
        return 'Ticket asignado';

      case 'UNASSIGN_TICKET':
      case 'UNASSIGNED':
        return 'Asignación removida';

      case 'UPDATE_STATUS':
      case 'STATUS_CHANGED':
        const statusLabels: Record<string, string> = {
          NEW: 'Nuevo',
          ASSIGNED: 'Asignado',
          IN_PROGRESS: 'En Progreso',
          WAITING: 'En Espera',
          RESOLVED: 'Resuelto',
          CLOSED: 'Cerrado',
          CANCELLED: 'Cancelado'
        };
        const newStatus = detailsObj?.newStatus || detailsObj?.status || detailsObj?.to;
        if (newStatus) {
          return `Estado cambiado a: ${statusLabels[newStatus] || newStatus}`;
        }
        return 'Estado actualizado';

      case 'UPDATE_PRIORITY':
      case 'PRIORITY_CHANGED':
        const priorityLabels: Record<string, string> = {
          LOW: 'Baja',
          MEDIUM: 'Media',
          HIGH: 'Alta',
          CRITICAL: 'Crítica'
        };
        const newPriority = detailsObj?.newPriority || detailsObj?.priority || detailsObj?.to;
        if (newPriority) {
          return `Prioridad cambiada a: ${priorityLabels[newPriority] || newPriority}`;
        }
        return 'Prioridad actualizada';

      case 'UPDATE_TICKET':
      case 'TICKET_UPDATED':
        if (detailsObj?.field) {
          const fieldLabels: Record<string, string> = {
            title: 'título',
            description: 'descripción',
            status: 'estado',
            priority: 'prioridad',
            assignedTo: 'asignación'
          };
          const fieldName = fieldLabels[detailsObj.field] || detailsObj.field;
          return `Actualizado el ${fieldName}`;
        }
        return 'Ticket actualizado';

      case 'RESOLVE_TICKET':
      case 'RESOLVED':
        return 'Marcado como resuelto';

      case 'CLOSE_TICKET':
      case 'CLOSED':
        return 'Ticket cerrado';

      case 'REOPEN_TICKET':
      case 'REOPENED':
        return 'Ticket reabierto';

      case 'RATE_TICKET':
      case 'RATED':
        if (detailsObj?.rating) {
          return `Calificado con ${detailsObj.rating} estrellas`;
        }
        return 'Ticket calificado';

      case 'ADD_COMMENT':
      case 'COMMENT_ADDED':
        return 'Comentario agregado';

      case 'UPLOAD_FILE':
      case 'FILE_UPLOADED':
        if (detailsObj?.filename) {
          return `Archivo adjunto: ${detailsObj.filename}`;
        }
        if (detailsObj?.fileCount) {
          return `${detailsObj.fileCount} archivo(s) adjuntado(s)`;
        }
        return 'Archivo adjuntado';

      case 'DELETE_FILE':
      case 'FILE_DELETED':
        if (detailsObj?.filename) {
          return `Archivo eliminado: ${detailsObj.filename}`;
        }
        return 'Archivo eliminado';

      case 'SLA_PAUSED':
        return 'Tiempo de respuesta pausado';

      case 'SLA_RESUMED':
        return 'Tiempo de respuesta reanudado';

      case 'SLA_BREACHED':
      case 'SLA_EXCEEDED':
        return 'Tiempo de respuesta excedido';

      case 'SLA_WARNING':
        return 'Tiempo de respuesta próximo a vencer';

      case 'AUTO_CLOSE_TICKET':
        if (detailsObj?.reason) {
          return `Cerrado automáticamente: ${detailsObj.reason}`;
        }
        return 'Cerrado automáticamente por inactividad';

      case 'DEPARTMENT_CHANGED':
        if (detailsObj?.newDepartment) {
          return `Transferido a: ${detailsObj.newDepartment}`;
        }
        return 'Departamento cambiado';

      case 'FORM_UPDATED':
        return 'Formulario actualizado';

      case 'UPLOAD_DELIVERABLE':
        return 'Entregable subido';

      case 'APPROVE_DELIVERABLE':
        return 'Entregable aprobado';

      case 'REJECT_DELIVERABLE':
        if (detailsObj?.body?.rejectionReason) {
          return `Entregable rechazado: ${detailsObj.body.rejectionReason}`;
        }
        return 'Entregable rechazado';

      case 'NOTIFICATION_SENT':
        return 'Notificación enviada';

      case 'EMAIL_SENT':
        return 'Correo electrónico enviado';

      default:
        // Si no reconocemos la acción, la traducimos de forma genérica
        // Convertir de SNAKE_CASE a texto legible en español
        const translated = action
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/ticket/g, 'ticket')
          .replace(/create/g, 'crear')
          .replace(/update/g, 'actualizar')
          .replace(/delete/g, 'eliminar')
          .replace(/assign/g, 'asignar')
          .replace(/close/g, 'cerrar')
          .replace(/open/g, 'abrir')
          .replace(/reopen/g, 'reabrir')
          .replace(/resolve/g, 'resolver')
          .replace(/add/g, 'agregar')
          .replace(/remove/g, 'remover')
          .replace(/change/g, 'cambiar')
          .replace(/upload/g, 'subir')
          .replace(/download/g, 'descargar')
          .replace(/\b\w/g, (char) => char.toUpperCase());
        
        return translated;
    }
  } catch (error) {
    // Si hay error al parsear, devolver mensaje genérico
    console.error('Error parsing history message:', error);
    return 'Acción realizada';
  }
};

/**
 * Obtiene un ícono apropiado para cada tipo de acción
 */
export const getHistoryIcon = (action: string): React.ReactNode => {
  const icon = (component: any, color: string) => createElement(component, { className: `w-4 h-4 ${color}` });

  switch (action) {
    case 'CREATE_TICKET':
      return icon(FiFileText, 'text-blue-500');
    
    case 'ASSIGN_TICKET':
    case 'ASSIGNED':
      return icon(FiUserCheck, 'text-purple-500');
    
    case 'UNASSIGN_TICKET':
    case 'UNASSIGNED':
      return icon(FiUserX, 'text-gray-500');
    
    case 'UPDATE_STATUS':
    case 'STATUS_CHANGED':
      return icon(FiRefreshCw, 'text-cyan-500');
    
    case 'UPDATE_PRIORITY':
    case 'PRIORITY_CHANGED':
      return icon(FiAlertTriangle, 'text-orange-500');
    
    case 'UPDATE_TICKET':
    case 'TICKET_UPDATED':
      return icon(FiEdit, 'text-indigo-500');
    
    case 'RESOLVE_TICKET':
    case 'RESOLVED':
      return icon(FiCheckCircle, 'text-green-500');
    
    case 'CLOSE_TICKET':
    case 'CLOSED':
      return icon(FiLock, 'text-gray-600');
    
    case 'REOPEN_TICKET':
    case 'REOPENED':
      return icon(FiUnlock, 'text-amber-500');
    
    case 'RATE_TICKET':
    case 'RATED':
      return icon(FiStar, 'text-yellow-500');
    
    case 'ADD_COMMENT':
    case 'COMMENT_ADDED':
      return icon(FiMessageSquare, 'text-blue-400');
    
    case 'UPLOAD_FILE':
    case 'FILE_UPLOADED':
      return icon(FiPaperclip, 'text-teal-500');
    
    case 'DELETE_FILE':
    case 'FILE_DELETED':
      return icon(FiTrash2, 'text-red-400');
    
    case 'SLA_PAUSED':
      return icon(FiPauseCircle, 'text-orange-400');
    
    case 'SLA_RESUMED':
      return icon(FiPlayCircle, 'text-green-400');
    
    case 'SLA_BREACHED':
    case 'SLA_EXCEEDED':
      return icon(FiAlertOctagon, 'text-red-600');
    
    case 'SLA_WARNING':
      return icon(FiClock, 'text-orange-500');
    
    case 'AUTO_CLOSE_TICKET':
      return icon(FiCpu, 'text-gray-500');
    
    case 'DEPARTMENT_CHANGED':
      return icon(FiBriefcase, 'text-violet-500');
    
    case 'FORM_UPDATED':
      return icon(FiClipboard, 'text-sky-500');
    
    case 'UPLOAD_DELIVERABLE':
      return icon(FiPackage, 'text-purple-500');
    
    case 'APPROVE_DELIVERABLE':
      return icon(FiCheckCircle, 'text-emerald-500');
    
    case 'REJECT_DELIVERABLE':
      return icon(FiXCircle, 'text-red-500');
    
    case 'NOTIFICATION_SENT':
      return icon(FiBell, 'text-amber-400');
    
    case 'EMAIL_SENT':
      return icon(FiMail, 'text-blue-500');
    
    default:
      return icon(FiActivity, 'text-gray-400');
  }
};
