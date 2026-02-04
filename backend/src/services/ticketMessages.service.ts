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
          }
        },
        orderBy: { createdAt: 'asc' },
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
    }
  ) {
    try {
      const newMessage = await prisma.ticketMessage.create({
        data: {
          ticketId,
          userId,
          message,
          attachmentUrl: attachment?.url,
          attachmentName: attachment?.name,
          attachmentType: attachment?.type,
          attachmentSize: attachment?.size
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
        }
      });

      logger.info(`Message created in ticket ${ticketId} by user ${userId}`, {
        hasAttachment: !!attachment
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
  }
};
