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
        return '⚠️ Tiempo de respuesta excedido';

      case 'SLA_WARNING':
        return '⏰ Tiempo de respuesta próximo a vencer';

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
export const getHistoryIcon = (action: string): string => {
  switch (action) {
    case 'CREATE_TICKET':
      return '🎫';
    
    case 'ASSIGN_TICKET':
    case 'ASSIGNED':
      return '👤';
    
    case 'UNASSIGN_TICKET':
    case 'UNASSIGNED':
      return '❌';
    
    case 'UPDATE_STATUS':
    case 'STATUS_CHANGED':
      return '🔄';
    
    case 'UPDATE_PRIORITY':
    case 'PRIORITY_CHANGED':
      return '⚠️';
    
    case 'UPDATE_TICKET':
    case 'TICKET_UPDATED':
      return '✏️';
    
    case 'RESOLVE_TICKET':
    case 'RESOLVED':
      return '✅';
    
    case 'CLOSE_TICKET':
    case 'CLOSED':
      return '🔒';
    
    case 'REOPEN_TICKET':
    case 'REOPENED':
      return '🔓';
    
    case 'RATE_TICKET':
    case 'RATED':
      return '⭐';
    
    case 'ADD_COMMENT':
    case 'COMMENT_ADDED':
      return '💬';
    
    case 'UPLOAD_FILE':
    case 'FILE_UPLOADED':
      return '📎';
    
    case 'DELETE_FILE':
    case 'FILE_DELETED':
      return '🗑️';
    
    case 'SLA_PAUSED':
      return '⏸️';
    
    case 'SLA_RESUMED':
      return '▶️';
    
    case 'SLA_BREACHED':
    case 'SLA_EXCEEDED':
      return '🚨';
    
    case 'SLA_WARNING':
      return '⏰';
    
    case 'AUTO_CLOSE_TICKET':
      return '🤖';
    
    case 'DEPARTMENT_CHANGED':
      return '🏢';
    
    case 'FORM_UPDATED':
      return '📋';
    
    case 'NOTIFICATION_SENT':
      return '🔔';
    
    case 'EMAIL_SENT':
      return '📧';
    
    default:
      return '📝';
  }
};
