import { Router } from 'express';
import { ticketMessagesController } from '../controllers/ticketMessages.controller';
import { authenticate } from '../middlewares/auth';
import { chatMessageRateLimiter } from '../middlewares/security.middleware';

const router = Router();

// Ruta de búsqueda debe ir ANTES de la ruta genérica
router.get('/tickets/:ticketId/messages/search', authenticate, ticketMessagesController.searchMessages as any);
router.get('/tickets/:ticketId/messages', authenticate, ticketMessagesController.getMessages as any);
router.post('/tickets/:ticketId/messages', authenticate, chatMessageRateLimiter, ticketMessagesController.createMessage as any);
router.delete('/messages/:messageId', authenticate, ticketMessagesController.deleteMessage as any);

export default router;
