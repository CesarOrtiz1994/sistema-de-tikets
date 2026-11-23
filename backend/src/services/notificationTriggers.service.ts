import { NotificationType } from '@prisma/client';
import { notificationService } from './notification.service';
import prisma from '../config/database';
import { env } from '../config/env';
import logger from '../config/logger';

const FRONTEND_URL = env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
const currentYear = () => new Date().getFullYear().toString();

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
};

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En Progreso',
  WAITING: 'En Espera',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado'
};

/**
 * Obtener los admin IDs de un departamento
 */
async function getDeptAdminIds(departmentId: string): Promise<string[]> {
  const admins = await prisma.departmentUser.findMany({
    where: { departmentId, role: 'ADMIN' },
    select: { userId: true }
  });
  return admins.map(a => a.userId);
}

/**
 * Obtener los IDs de todos los usuarios asignados a un ticket.
 * Los tickets pueden tener varios asignados (tabla ticket_assignments).
 */
async function getAssigneeIds(ticketId: string): Promise<string[]> {
  const assignments = await prisma.ticketAssignment.findMany({
    where: { ticketId },
    select: { userId: true }
  });
  return assignments.map(a => a.userId);
}

// ============================================
// TICKET LIFECYCLE NOTIFICATIONS
// ============================================

/**
 * Ticket creado → notificar a admins del departamento
 */
export async function notifyTicketCreated(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  departmentId: string;
  requesterId: string;
  department?: { name: string };
  requester?: { name: string };
}) {
  try {
    logger.info(`[notifyTicketCreated] Ticket: ${ticket.ticketNumber}, deptId: ${ticket.departmentId}`);
    const deptName = ticket.department?.name || '';
    const requesterName = ticket.requester?.name || '';
    const adminIds = await getDeptAdminIds(ticket.departmentId);

    logger.info(`[notifyTicketCreated] Found ${adminIds.length} DEPT_ADMINs: ${JSON.stringify(adminIds)}`);

    if (adminIds.length === 0) {
      logger.warn(`[notifyTicketCreated] No DEPT_ADMINs found for department ${ticket.departmentId}, skipping`);
      return;
    }

    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    await notificationService.sendToMany(
      adminIds,
      NotificationType.TICKET_CREATED,
      'Nuevo ticket creado',
      `${ticket.ticketNumber}: ${ticket.title} — Solicitante: ${requesterName}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      {
        sendEmail: true,
        emailTemplateCode: 'TICKET_CREATED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          department_name: deptName,
          ticket_priority: priorityLabels[ticket.priority] || ticket.priority,
          requester_name: requesterName,
          ticket_url: ticketUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifyTicketCreated:', error);
  }
}

/**
 * Ticket asignado → notificar a todos los subordinados asignados
 */
export async function notifyTicketAssigned(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  departmentId: string;
  department?: { name: string };
  requester?: { name: string };
  assignments?: Array<{ user: { id: string; name: string } }>;
}) {
  try {
    logger.info(`[notifyTicketAssigned] Ticket: ${ticket.ticketNumber}, assignments: ${ticket.assignments?.length || 0}`);
    if (!ticket.assignments || ticket.assignments.length === 0) {
      logger.warn(`[notifyTicketAssigned] No assignments, skipping`);
      return;
    }

    const deptName = ticket.department?.name || '';
    const requesterName = ticket.requester?.name || '';
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    // Notificar a cada usuario asignado
    for (const assignment of ticket.assignments) {
      await notificationService.send(
        {
          userId: assignment.user.id,
          type: NotificationType.TICKET_ASSIGNED,
          title: 'Ticket asignado',
          message: `Se te asignó el ticket ${ticket.ticketNumber}: ${ticket.title}`,
          data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber }
        },
        {
          sendEmail: true,
          emailTemplateCode: 'TICKET_ASSIGNED',
          emailVariables: {
            ticket_number: ticket.ticketNumber,
            ticket_title: ticket.title,
            department_name: deptName,
            ticket_priority: priorityLabels[ticket.priority] || ticket.priority,
            requester_name: requesterName,
            ticket_url: ticketUrl,
            year: currentYear()
          },
          sendPush: true,
          pushData: { ticketId: ticket.id, url: ticketUrl }
        }
      );
      logger.info(`[notifyTicketAssigned] Notificación enviada a ${assignment.user.name} (${assignment.user.id})`);
    }
  } catch (error) {
    logger.error('Error in notifyTicketAssigned:', error);
  }
}

/**
 * Estado del ticket cambiado → notificar a solicitante y asignado
 */
export async function notifyTicketStatusChanged(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  requesterId: string;
}, newStatus: string, changedByUserId: string) {
  try {
    const assigneeIds = await getAssigneeIds(ticket.id);
    logger.info(`[notifyTicketStatusChanged] Ticket: ${ticket.ticketNumber}, requesterId: ${ticket.requesterId}, assignees: ${assigneeIds.length}, newStatus: ${newStatus}, changedBy: ${changedByUserId}`);
    const label = statusLabels[newStatus] || newStatus;
    const userIds = Array.from(new Set([ticket.requesterId, ...assigneeIds]))
      .filter((uid): uid is string => !!uid && uid !== changedByUserId);

    logger.info(`[notifyTicketStatusChanged] userIds to notify: ${JSON.stringify(userIds)}`);
    if (userIds.length === 0) {
      logger.warn(`[notifyTicketStatusChanged] No users to notify (all filtered out), skipping`);
      return;
    }

    await notificationService.sendToMany(
      userIds,
      NotificationType.TICKET_STATUS_CHANGED,
      'Estado de ticket actualizado',
      `${ticket.ticketNumber}: Estado cambiado a ${label}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, newStatus }
    );
  } catch (error) {
    logger.error('Error in notifyTicketStatusChanged:', error);
  }
}

/**
 * Prioridad del ticket cambiada → notificar a solicitante y asignado
 */
export async function notifyTicketPriorityChanged(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  requesterId: string;
}, newPriority: string, changedByUserId: string) {
  try {
    const label = priorityLabels[newPriority] || newPriority;
    const assigneeIds = await getAssigneeIds(ticket.id);
    const userIds = Array.from(new Set([ticket.requesterId, ...assigneeIds]))
      .filter((uid): uid is string => !!uid && uid !== changedByUserId);

    if (userIds.length === 0) return;

    await notificationService.sendToMany(
      userIds,
      NotificationType.TICKET_PRIORITY_CHANGED,
      'Prioridad de ticket actualizada',
      `${ticket.ticketNumber}: Prioridad cambiada a ${label}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, newPriority }
    );
  } catch (error) {
    logger.error('Error in notifyTicketPriorityChanged:', error);
  }
}

/**
 * Fecha de entrega cambiada manualmente (SLA personalizado) → notificar al solicitante y asignados
 */
export async function notifyTicketSlaDeadlineChanged(ticket: {
  id: string;
  ticketNumber: string;
  requesterId: string;
  assignments?: Array<{ userId?: string; user?: { id: string } }>;
}, newDeadline: Date, changedByUserId: string) {
  try {
    const assignedIds = (ticket.assignments || [])
      .map(a => a.userId || a.user?.id)
      .filter((uid): uid is string => !!uid);
    const userIds = Array.from(new Set([ticket.requesterId, ...assignedIds]))
      .filter(uid => uid !== changedByUserId);

    if (userIds.length === 0) return;

    const deadline = newDeadline.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    await notificationService.sendToMany(
      userIds,
      NotificationType.TICKET_SLA_DEADLINE_CHANGED,
      'Fecha de entrega actualizada',
      `${ticket.ticketNumber}: La fecha de entrega ahora es ${deadline}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, slaDeadline: newDeadline.toISOString() }
    );
  } catch (error) {
    logger.error('Error in notifyTicketSlaDeadlineChanged:', error);
  }
}

/**
 * Ticket resuelto → notificar al solicitante
 */
export async function notifyTicketResolved(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  requesterId: string;
}, resolvedByName: string) {
  try {
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    await notificationService.send(
      {
        userId: ticket.requesterId,
        type: NotificationType.TICKET_RESOLVED,
        title: 'Ticket resuelto',
        message: `Tu ticket ${ticket.ticketNumber} ha sido resuelto. Por favor revisa y cierra.`,
        data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber }
      },
      {
        sendEmail: true,
        emailTemplateCode: 'TICKET_RESOLVED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          resolved_by: resolvedByName,
          ticket_url: ticketUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifyTicketResolved:', error);
  }
}

/**
 * Ticket cerrado → notificar al asignado
 */
export async function notifyTicketClosed(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
}, closedByName: string) {
  try {
    const assigneeIds = await getAssigneeIds(ticket.id);
    if (assigneeIds.length === 0) return;

    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    await notificationService.sendToMany(
      assigneeIds,
      NotificationType.TICKET_CLOSED,
      'Ticket cerrado',
      `El ticket ${ticket.ticketNumber} ha sido cerrado por el solicitante.`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      {
        sendEmail: true,
        emailTemplateCode: 'TICKET_CLOSED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          closed_by: closedByName,
          ticket_url: ticketUrl,
          year: currentYear()
        }
      }
    );
  } catch (error) {
    logger.error('Error in notifyTicketClosed:', error);
  }
}

/**
 * Ticket reabierto → notificar al asignado + admins dept
 */
export async function notifyTicketReopened(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  departmentId: string;
}, reason: string, reopenedByName: string) {
  try {
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
    const adminIds = await getDeptAdminIds(ticket.departmentId);
    const assigneeIds = await getAssigneeIds(ticket.id);
    const userIds = [...new Set([...assigneeIds, ...adminIds])];

    if (userIds.length === 0) return;

    await notificationService.sendToMany(
      userIds,
      NotificationType.TICKET_REOPENED,
      'Ticket reabierto',
      `El ticket ${ticket.ticketNumber} ha sido reabierto. Razón: ${reason}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, reason },
      {
        sendEmail: true,
        emailTemplateCode: 'TICKET_REOPENED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          reopen_reason: reason,
          reopened_by: reopenedByName,
          ticket_url: ticketUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifyTicketReopened:', error);
  }
}

/**
 * Ticket calificado → notificar al asignado
 */
export async function notifyTicketRated(ticket: {
  id: string;
  ticketNumber: string;
}, rating: number) {
  try {
    const assigneeIds = await getAssigneeIds(ticket.id);
    if (assigneeIds.length === 0) return;

    await notificationService.sendToMany(
      assigneeIds,
      NotificationType.TICKET_RATED,
      'Ticket calificado',
      `El ticket ${ticket.ticketNumber} fue calificado con ${rating} estrella(s).`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, rating }
    );
  } catch (error) {
    logger.error('Error in notifyTicketRated:', error);
  }
}

/**
 * Ticket auto-cerrado → notificar al solicitante
 */
export async function notifyTicketAutoClosed(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  requesterId: string;
}, days: number) {
  try {
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    await notificationService.send(
      {
        userId: ticket.requesterId,
        type: NotificationType.TICKET_AUTO_CLOSED,
        title: 'Ticket cerrado automáticamente',
        message: `Tu ticket ${ticket.ticketNumber} fue cerrado automáticamente por inactividad (${days} días).`,
        data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber }
      },
      {
        sendEmail: true,
        emailTemplateCode: 'TICKET_AUTO_CLOSED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          days: days.toString(),
          ticket_url: ticketUrl,
          year: currentYear()
        }
      }
    );
  } catch (error) {
    logger.error('Error in notifyTicketAutoClosed:', error);
  }
}

// ============================================
// DELIVERABLE NOTIFICATIONS
// ============================================

/**
 * Entregable subido → notificar al solicitante
 */
export async function notifyDeliverableUploaded(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  requesterId: string;
}, fileName: string, uploadedByName: string, fileUrl: string) {
  try {
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
    const downloadUrl = `${process.env.API_URL || 'http://localhost:3000'}${fileUrl}`;

    await notificationService.send(
      {
        userId: ticket.requesterId,
        type: NotificationType.DELIVERABLE_UPLOADED,
        title: 'Nuevo entregable',
        message: `Se subió un entregable en el ticket ${ticket.ticketNumber}. Revisa y aprueba o rechaza.`,
        data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, fileName }
      },
      {
        sendEmail: true,
        emailTemplateCode: 'DELIVERABLE_UPLOADED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          file_name: fileName,
          uploaded_by: uploadedByName,
          ticket_url: ticketUrl,
          download_url: downloadUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifyDeliverableUploaded:', error);
  }
}

/**
 * Entregable aprobado → notificar al subordinado asignado
 */
export async function notifyDeliverableApproved(ticket: {
  id: string;
  ticketNumber: string;
}) {
  try {
    const assigneeIds = await getAssigneeIds(ticket.id);
    if (assigneeIds.length === 0) return;

    await notificationService.sendToMany(
      assigneeIds,
      NotificationType.DELIVERABLE_APPROVED,
      'Entregable aprobado',
      `Tu entregable del ticket ${ticket.ticketNumber} fue aprobado.`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber }
    );
  } catch (error) {
    logger.error('Error in notifyDeliverableApproved:', error);
  }
}

/**
 * Entregable rechazado → notificar al subordinado asignado
 */
export async function notifyDeliverableRejected(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
}, rejectionReason: string, remainingAttempts: number) {
  try {
    const assigneeIds = await getAssigneeIds(ticket.id);
    if (assigneeIds.length === 0) return;

    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    await notificationService.sendToMany(
      assigneeIds,
      NotificationType.DELIVERABLE_REJECTED,
      'Entregable rechazado',
      `Tu entregable del ticket ${ticket.ticketNumber} fue rechazado. Intentos restantes: ${remainingAttempts}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, rejectionReason, remainingAttempts },
      {
        sendEmail: true,
        emailTemplateCode: 'DELIVERABLE_REJECTED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          rejection_reason: rejectionReason,
          remaining_attempts: remainingAttempts.toString(),
          ticket_url: ticketUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifyDeliverableRejected:', error);
  }
}

// ============================================
// SLA NOTIFICATIONS
// ============================================

/**
 * SLA warning → notificar al asignado + admins dept
 */
export async function notifySLAWarning(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  departmentId: string;
  slaDeadline?: Date | null;
}) {
  try {
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
    const adminIds = await getDeptAdminIds(ticket.departmentId);
    const assigneeIds = await getAssigneeIds(ticket.id);
    const userIds = [...new Set([...assigneeIds, ...adminIds])];

    if (userIds.length === 0) return;

    const deadline = ticket.slaDeadline
      ? new Date(ticket.slaDeadline).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
      : 'N/A';

    await notificationService.sendToMany(
      userIds,
      NotificationType.SLA_WARNING,
      'SLA próximo a vencer',
      `El ticket ${ticket.ticketNumber} está próximo a exceder su SLA (${deadline}).`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      {
        sendEmail: true,
        emailTemplateCode: 'SLA_WARNING',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          sla_deadline: deadline,
          ticket_url: ticketUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifySLAWarning:', error);
  }
}

/**
 * SLA excedido → notificar al asignado + admins dept
 */
export async function notifySLAExceeded(ticket: {
  id: string;
  ticketNumber: string;
  title: string;
  departmentId: string;
  slaDeadline?: Date | null;
}) {
  try {
    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
    const adminIds = await getDeptAdminIds(ticket.departmentId);
    const assigneeIds = await getAssigneeIds(ticket.id);
    const userIds = [...new Set([...assigneeIds, ...adminIds])];

    if (userIds.length === 0) return;

    const deadline = ticket.slaDeadline
      ? new Date(ticket.slaDeadline).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
      : 'N/A';

    await notificationService.sendToMany(
      userIds,
      NotificationType.SLA_EXCEEDED,
      'SLA excedido',
      `El ticket ${ticket.ticketNumber} ha excedido su SLA (${deadline}).`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      {
        sendEmail: true,
        emailTemplateCode: 'SLA_EXCEEDED',
        emailVariables: {
          ticket_number: ticket.ticketNumber,
          ticket_title: ticket.title,
          sla_deadline: deadline,
          ticket_url: ticketUrl,
          year: currentYear()
        },
        sendPush: true,
        pushData: { ticketId: ticket.id, url: ticketUrl }
      }
    );
  } catch (error) {
    logger.error('Error in notifySLAExceeded:', error);
  }
}

/**
 * Nuevo mensaje (para push cuando offline) → notificar a los involucrados
 */
export async function notifyNewMessage(ticket: {
  id: string;
  ticketNumber: string;
  requesterId: string;
}, senderUserId: string, senderName: string) {
  try {
    const assigneeIds = await getAssigneeIds(ticket.id);
    const userIds = Array.from(new Set([ticket.requesterId, ...assigneeIds]))
      .filter((uid): uid is string => !!uid && uid !== senderUserId);

    if (userIds.length === 0) return;

    const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

    for (const userId of userIds) {
      await notificationService.send(
        {
          userId,
          type: NotificationType.NEW_MESSAGE,
          title: 'Nuevo mensaje',
          message: `${senderName} envió un mensaje en el ticket ${ticket.ticketNumber}`,
          data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, senderName }
        },
        {
          sendPush: true,
          pushData: { ticketId: ticket.id, url: ticketUrl }
        }
      );
    }
  } catch (error) {
    logger.error('Error in notifyNewMessage:', error);
  }
}
