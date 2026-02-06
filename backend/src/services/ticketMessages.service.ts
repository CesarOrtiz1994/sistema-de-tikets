import prisma from '../config/database';
import logger from '../config/logger';

export const ticketMessagesService = {
  async getMessagesByTicketId(ticketId: string, limit: number = 50, offset: number = 0) {
    try {
      const messages = await prisma.ticketMessage.findMany({
        where: { ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          },
          replyTo: {
            select: {
              id: true,
              message: true,
              userId: true,
              createdAt: true,
              attachmentUrl: true,
              attachmentName: true,
              attachmentType: true,
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
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.ticketMessage.count({
        where: { ticketId }
      });

      return { messages, total };
    } catch (error) {
      logger.error('Error fetching ticket messages:', error);
      throw error;
    }
  },

  async createMessage(
    ticketId: string, 
    userId: string, 
    message: string,
    attachment?: {
      url: string;
      name: string;
      type: string;
      size: number;
    },
    replyToId?: string
  ) {
    try {
      // Validar que el mensaje padre existe si se proporciona replyToId
      if (replyToId) {
        const parentMessage = await prisma.ticketMessage.findUnique({
          where: { id: replyToId }
        });

        if (!parentMessage) {
          throw new Error('Parent message not found');
        }

        if (parentMessage.ticketId !== ticketId) {
          throw new Error('Parent message belongs to different ticket');
        }
      }

      const createdMessage = await prisma.ticketMessage.create({
        data: {
          ticketId,
          userId,
          message,
          attachmentUrl: attachment?.url,
          attachmentName: attachment?.name,
          attachmentType: attachment?.type,
          attachmentSize: attachment?.size,
          replyToId
        }
      });

      // Consultar el mensaje creado con todas las relaciones
      const newMessage = await prisma.ticketMessage.findUnique({
        where: { id: createdMessage.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          },
          replyTo: {
            select: {
              id: true,
              message: true,
              userId: true,
              createdAt: true,
              attachmentUrl: true,
              attachmentName: true,
              attachmentType: true,
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
      });

      if (!newMessage) {
        throw new Error('Failed to retrieve created message');
      }

      logger.info(`Message created in ticket ${ticketId} by user ${userId}`, {
        hasAttachment: !!attachment,
        isReply: !!replyToId,
        replyToPopulated: !!newMessage.replyTo
      });
      return newMessage;
    } catch (error) {
      logger.error('Error creating ticket message:', error);
      throw error;
    }
  },

  async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await prisma.ticketMessage.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.userId !== userId) {
        throw new Error('Unauthorized to delete this message');
      }

      await prisma.ticketMessage.delete({
        where: { id: messageId }
      });

      logger.info(`Message ${messageId} deleted by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting ticket message:', error);
      throw error;
    }
  },

  async searchMessages(ticketId: string, query: string, limit: number = 50, offset: number = 0) {
    try {
      // Buscar mensajes que contengan el término de búsqueda (case-insensitive)
      const messages = await prisma.ticketMessage.findMany({
        where: {
          ticketId,
          message: {
            contains: query,
            mode: 'insensitive'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }, // Más recientes primero en búsqueda
        take: limit,
        skip: offset
      });

      const total = await prisma.ticketMessage.count({
        where: {
          ticketId,
          message: {
            contains: query,
            mode: 'insensitive'
          }
        }
      });

      logger.info(`Search in ticket ${ticketId} for "${query}" found ${total} results`);
      return { messages, total };
    } catch (error) {
      logger.error('Error searching ticket messages:', error);
      throw error;
    }
  }
};
