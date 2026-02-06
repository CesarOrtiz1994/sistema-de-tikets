import prisma from '../config/database';
import logger from '../config/logger';

export const unreadMessagesService = {
  /**
   * Obtener el conteo de mensajes no leídos para un ticket específico
   */
  async getUnreadCount(userId: string, ticketId: string): Promise<number> {
    try {
      // Obtener el último mensaje leído por el usuario en este ticket
      const userRead = await prisma.ticketUserRead.findUnique({
        where: {
          ticketId_userId: {
            ticketId,
            userId
          }
        }
      });

      // Si no hay registro de lectura, contar todos los mensajes del ticket que no sean del usuario
      if (!userRead) {
        const count = await prisma.ticketMessage.count({
          where: {
            ticketId,
            userId: {
              not: userId // No contar mensajes propios
            }
          }
        });
        return count;
      }

      // Contar mensajes creados después del último leído
      const count = await prisma.ticketMessage.count({
        where: {
          ticketId,
          userId: {
            not: userId // No contar mensajes propios
          },
          createdAt: {
            gt: userRead.lastReadAt
          }
        }
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  },

  /**
   * Obtener el conteo de mensajes no leídos para todos los tickets del usuario
   */
  async getUnreadCountsByUser(userId: string): Promise<Record<string, number>> {
    try {
      // Obtener todos los tickets donde el usuario es requester o assignedTo
      const tickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { requesterId: userId },
            { assignedToId: userId }
          ],
          deletedAt: null
        },
        select: {
          id: true
        }
      });

      const ticketIds = tickets.map(t => t.id);

      // Obtener registros de lectura del usuario
      const userReads = await prisma.ticketUserRead.findMany({
        where: {
          userId,
          ticketId: {
            in: ticketIds
          }
        }
      });

      // Crear mapa de ticketId -> lastReadAt
      const readMap = new Map<string, Date>();
      userReads.forEach(read => {
        readMap.set(read.ticketId, read.lastReadAt);
      });

      // Contar mensajes no leídos por ticket
      const counts: Record<string, number> = {};

      for (const ticketId of ticketIds) {
        const lastReadAt = readMap.get(ticketId);

        if (!lastReadAt) {
          // No hay registro de lectura, contar todos los mensajes que no sean del usuario
          const count = await prisma.ticketMessage.count({
            where: {
              ticketId,
              userId: {
                not: userId
              }
            }
          });
          counts[ticketId] = count;
        } else {
          // Contar mensajes después del último leído
          const count = await prisma.ticketMessage.count({
            where: {
              ticketId,
              userId: {
                not: userId
              },
              createdAt: {
                gt: lastReadAt
              }
            }
          });
          counts[ticketId] = count;
        }
      }

      return counts;
    } catch (error) {
      logger.error('Error getting unread counts by user:', error);
      throw error;
    }
  },

  /**
   * Marcar un ticket como leído para un usuario
   */
  async markAsRead(userId: string, ticketId: string): Promise<void> {
    try {
      // Obtener el último mensaje del ticket
      const lastMessage = await prisma.ticketMessage.findFirst({
        where: { ticketId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true }
      });

      // Crear o actualizar el registro de lectura
      await prisma.ticketUserRead.upsert({
        where: {
          ticketId_userId: {
            ticketId,
            userId
          }
        },
        create: {
          ticketId,
          userId,
          lastReadAt: lastMessage?.createdAt || new Date(),
          lastMessageId: lastMessage?.id
        },
        update: {
          lastReadAt: lastMessage?.createdAt || new Date(),
          lastMessageId: lastMessage?.id
        }
      });

      logger.info(`Ticket ${ticketId} marked as read by user ${userId}`);
    } catch (error) {
      logger.error('Error marking ticket as read:', error);
      throw error;
    }
  },

  /**
   * Actualizar el timestamp de lectura cuando se recibe un nuevo mensaje
   * (para el autor del mensaje)
   */
  async updateReadOnSend(userId: string, ticketId: string, messageId: string): Promise<void> {
    try {
      await prisma.ticketUserRead.upsert({
        where: {
          ticketId_userId: {
            ticketId,
            userId
          }
        },
        create: {
          ticketId,
          userId,
          lastReadAt: new Date(),
          lastMessageId: messageId
        },
        update: {
          lastReadAt: new Date(),
          lastMessageId: messageId
        }
      });
    } catch (error) {
      logger.error('Error updating read on send:', error);
      throw error;
    }
  }
};
