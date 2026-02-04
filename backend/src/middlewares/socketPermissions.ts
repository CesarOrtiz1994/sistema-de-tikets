import { AuthenticatedSocket } from '../config/socket';
import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Verifica si el usuario tiene acceso a un ticket específico
 */
export const canAccessTicket = async (
  socket: AuthenticatedSocket,
  ticketId: string
): Promise<boolean> => {
  try {
    const userId = socket.userId;
    const userRole = socket.userRole;

    if (!userId || !userRole) {
      return false;
    }

    // SUPER_ADMIN tiene acceso a todos los tickets
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Obtener el ticket con sus relaciones
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        department: true
      }
    });

    if (!ticket) {
      logger.warn(`Ticket not found: ${ticketId}`);
      return false;
    }

    // El solicitante del ticket tiene acceso
    if (ticket.requesterId === userId) {
      return true;
    }

    // El usuario asignado tiene acceso
    if (ticket.assignedToId === userId) {
      return true;
    }

    // Verificar si el usuario pertenece al departamento del ticket
    const departmentUser = await prisma.departmentUser.findFirst({
      where: {
        userId,
        departmentId: ticket.departmentId
      }
    });

    if (departmentUser) {
      return true;
    }

    // Verificar acceso especial al departamento
    const ticketAccess = await prisma.departmentTicketAccess.findFirst({
      where: {
        userId,
        departmentId: ticket.departmentId
      }
    });

    if (ticketAccess) {
      return true;
    }

    logger.warn(`User ${userId} denied access to ticket ${ticketId}`);
    return false;
  } catch (error) {
    logger.error('Error checking ticket access:', error);
    return false;
  }
};

/**
 * Verifica si el usuario puede enviar mensajes en un ticket
 */
export const canSendMessage = async (
  socket: AuthenticatedSocket,
  ticketId: string
): Promise<boolean> => {
  // Por ahora, si tiene acceso al ticket, puede enviar mensajes
  return canAccessTicket(socket, ticketId);
};

/**
 * Verifica si el usuario es miembro del departamento del ticket
 */
export const isDepartmentMember = async (
  socket: AuthenticatedSocket,
  ticketId: string
): Promise<boolean> => {
  try {
    const userId = socket.userId;

    if (!userId) {
      return false;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { departmentId: true }
    });

    if (!ticket) {
      return false;
    }

    const departmentUser = await prisma.departmentUser.findFirst({
      where: {
        userId,
        departmentId: ticket.departmentId
      }
    });

    return !!departmentUser;
  } catch (error) {
    logger.error('Error checking department membership:', error);
    return false;
  }
};
