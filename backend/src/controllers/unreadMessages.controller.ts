import { Response } from 'express';
import { AuthRequest } from '../middlewares/audit.middleware';
import { unreadMessagesService } from '../services/unreadMessages.service';
import logger from '../config/logger';

export const unreadMessagesController = {
  /**
   * GET /api/tickets/:ticketId/unread-count
   * Obtener el conteo de mensajes no leídos para un ticket específico
   */
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { ticketId } = req.params;

      const count = await unreadMessagesService.getUnreadCount(userId, ticketId);

      return res.json({ count });
    } catch (error) {
      logger.error('Error in getUnreadCount:', error);
      return res.status(500).json({ error: 'Error al obtener conteo de mensajes no leídos' });
    }
  },

  /**
   * GET /api/tickets/unread-counts
   * Obtener el conteo de mensajes no leídos para todos los tickets del usuario
   */
  async getUnreadCounts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const counts = await unreadMessagesService.getUnreadCountsByUser(userId);

      return res.json({ counts });
    } catch (error) {
      logger.error('Error in getUnreadCounts:', error);
      return res.status(500).json({ error: 'Error al obtener conteos de mensajes no leídos' });
    }
  },

  /**
   * POST /api/tickets/:ticketId/mark-read
   * Marcar un ticket como leído
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { ticketId } = req.params;

      await unreadMessagesService.markAsRead(userId, ticketId);

      return res.json({ success: true });
    } catch (error) {
      logger.error('Error in markAsRead:', error);
      return res.status(500).json({ error: 'Error al marcar ticket como leído' });
    }
  }
};
