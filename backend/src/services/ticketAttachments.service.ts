import prisma from '../config/database';
import logger from '../config/logger';

export const ticketAttachmentsService = {
  async getAttachmentsByTicketId(ticketId: string, fileType?: string) {
    try {
      const whereClause: any = {
        ticketId,
        attachmentUrl: { not: null }
      };

      // Filtrar por tipo de archivo si se especifica
      if (fileType) {
        if (fileType === 'image') {
          whereClause.attachmentType = { startsWith: 'image/' };
        } else if (fileType === 'document') {
          whereClause.OR = [
            { attachmentType: { startsWith: 'application/pdf' } },
            { attachmentType: { startsWith: 'application/msword' } },
            { attachmentType: { startsWith: 'application/vnd.' } },
            { attachmentType: { startsWith: 'text/' } }
          ];
        } else if (fileType === 'video') {
          whereClause.attachmentType = { startsWith: 'video/' };
        } else if (fileType === 'audio') {
          whereClause.attachmentType = { startsWith: 'audio/' };
        }
      }

      const attachments = await prisma.ticketMessage.findMany({
        where: whereClause,
        select: {
          id: true,
          attachmentUrl: true,
          attachmentName: true,
          attachmentType: true,
          attachmentSize: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info(`Retrieved ${attachments.length} attachments for ticket ${ticketId}`, {
        fileType: fileType || 'all'
      });

      return attachments;
    } catch (error) {
      logger.error('Error fetching ticket attachments:', error);
      throw error;
    }
  },

  async getAttachmentStats(ticketId: string) {
    try {
      const stats = await prisma.ticketMessage.groupBy({
        by: ['attachmentType'],
        where: {
          ticketId,
          attachmentUrl: { not: null }
        },
        _count: {
          id: true
        },
        _sum: {
          attachmentSize: true
        }
      });

      const totalSize = stats.reduce((acc, stat) => acc + (stat._sum.attachmentSize || 0), 0);
      const totalCount = stats.reduce((acc, stat) => acc + stat._count.id, 0);

      // Categorizar por tipo
      const categories = {
        images: 0,
        documents: 0,
        videos: 0,
        audio: 0,
        other: 0
      };

      stats.forEach(stat => {
        const type = stat.attachmentType || '';
        if (type.startsWith('image/')) categories.images += stat._count.id;
        else if (type.startsWith('application/') || type.startsWith('text/')) categories.documents += stat._count.id;
        else if (type.startsWith('video/')) categories.videos += stat._count.id;
        else if (type.startsWith('audio/')) categories.audio += stat._count.id;
        else categories.other += stat._count.id;
      });

      return {
        totalCount,
        totalSize,
        categories
      };
    } catch (error) {
      logger.error('Error fetching attachment stats:', error);
      throw error;
    }
  }
};
