import { Request, Response } from 'express';
import { ticketAttachmentsService } from '../services/ticketAttachments.service';
import logger from '../config/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleType: string;
  };
}

export const ticketAttachmentsController = {
  async getAttachments(req: AuthRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { type } = req.query;

      const attachments = await ticketAttachmentsService.getAttachmentsByTicketId(
        ticketId,
        type as string | undefined
      );

      return res.json({ attachments });
    } catch (error) {
      logger.error('Error in getAttachments:', error);
      return res.status(500).json({ error: 'Error al obtener archivos adjuntos' });
    }
  },

  async getStats(req: AuthRequest, res: Response) {
    try {
      const { ticketId } = req.params;

      const stats = await ticketAttachmentsService.getAttachmentStats(ticketId);

      return res.json(stats);
    } catch (error) {
      logger.error('Error in getStats:', error);
      return res.status(500).json({ error: 'Error al obtener estadísticas de archivos' });
    }
  }
};
