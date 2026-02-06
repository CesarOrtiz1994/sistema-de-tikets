import { Request, Response } from 'express';
import { ticketMessagesService } from '../services/ticketMessages.service';
import logger from '../config/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleType: string;
  };
}

export const ticketMessagesController = {
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { messages, total } = await ticketMessagesService.getMessagesByTicketId(
        ticketId,
        limit,
        offset
      );

      return res.json({
        messages,
        total,
        limit,
        offset
      });
    } catch (error) {
      logger.error('Error in getMessages:', error);
      return res.status(500).json({ error: 'Error al obtener mensajes' });
    }
  },

  async createMessage(req: AuthRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
      const userId = req.user!.id;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      }

      if (message.length > 5000) {
        return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 5000 caracteres)' });
      }

      const newMessage = await ticketMessagesService.createMessage(
        ticketId,
        userId,
        message.trim()
      );

      return res.status(201).json(newMessage);
    } catch (error) {
      logger.error('Error in createMessage:', error);
      return res.status(500).json({ error: 'Error al crear mensaje' });
    }
  },

  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      await ticketMessagesService.deleteMessage(messageId, userId);

      return res.json({ success: true });
    } catch (error: any) {
      logger.error('Error in deleteMessage:', error);
      
      if (error.message === 'Message not found') {
        return res.status(404).json({ error: 'Mensaje no encontrado' });
      }
      
      if (error.message === 'Unauthorized to delete this message') {
        return res.status(403).json({ error: 'No autorizado para eliminar este mensaje' });
      }

      return res.status(500).json({ error: 'Error al eliminar mensaje' });
    }
  },

  async searchMessages(req: AuthRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'El término de búsqueda es requerido' });
      }

      if (query.length < 2) {
        return res.status(400).json({ error: 'El término de búsqueda debe tener al menos 2 caracteres' });
      }

      const { messages, total } = await ticketMessagesService.searchMessages(
        ticketId,
        query.trim(),
        limit,
        offset
      );

      return res.json({
        messages,
        total,
        limit,
        offset,
        query: query.trim()
      });
    } catch (error) {
      logger.error('Error in searchMessages:', error);
      return res.status(500).json({ error: 'Error al buscar mensajes' });
    }
  }
};
