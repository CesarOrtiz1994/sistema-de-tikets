import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { unreadMessagesController } from '../controllers/unreadMessages.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/unread-messages/counts - Obtener conteos de todos los tickets
router.get('/counts', unreadMessagesController.getUnreadCounts as any);

// GET /api/unread-messages/:ticketId/count - Obtener conteo de un ticket específico
router.get('/:ticketId/count', unreadMessagesController.getUnreadCount as any);

// POST /api/unread-messages/:ticketId/mark-read - Marcar ticket como leído
router.post('/:ticketId/mark-read', unreadMessagesController.markAsRead as any);

export default router;
