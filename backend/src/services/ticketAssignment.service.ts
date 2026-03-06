import prisma from '../config/database';
import logger from '../config/logger';

export class TicketAssignmentService {
  /**
   * Asigna múltiples usuarios a un ticket
   */
  async assignUsersToTicket(
    ticketId: string,
    userIds: string[],
    assignedBy?: string
  ): Promise<void> {
    try {
      // Eliminar asignaciones existentes
      await prisma.ticketAssignment.deleteMany({
        where: { ticketId }
      });

      // Crear nuevas asignaciones
      if (userIds.length > 0) {
        await prisma.ticketAssignment.createMany({
          data: userIds.map(userId => ({
            ticketId,
            userId,
            assignedBy
          }))
        });
      }
    } catch (error) {
      logger.error('Error assigning users to ticket:', error);
      throw error;
    }
  }

  /**
   * Obtiene los IDs de usuarios asignados a un ticket
   */
  async getAssignedUserIds(ticketId: string): Promise<string[]> {
    const assignments = await prisma.ticketAssignment.findMany({
      where: { ticketId },
      select: { userId: true }
    });

    return assignments.map(a => a.userId);
  }

  /**
   * Verifica si un usuario está asignado a un ticket
   */
  async isUserAssigned(ticketId: string, userId: string): Promise<boolean> {
    const assignment = await prisma.ticketAssignment.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId
        }
      }
    });

    return assignment !== null;
  }

  /**
   * Obtiene todos los tickets asignados a un usuario
   */
  async getTicketsAssignedToUser(userId: string) {
    const assignments = await prisma.ticketAssignment.findMany({
      where: { userId },
      include: {
        ticket: {
          include: {
            department: true,
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true
              }
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return assignments.map(a => a.ticket);
  }
}

export const ticketAssignmentService = new TicketAssignmentService();
