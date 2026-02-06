import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { ticketAttachmentsController } from '../controllers/ticketAttachments.controller';

const router = Router();

// GET /api/tickets/:ticketId/attachments - Obtener archivos adjuntos del ticket
router.get('/:ticketId/attachments', authenticate, ticketAttachmentsController.getAttachments as any);

// GET /api/tickets/:ticketId/attachments/stats - Obtener estadísticas de archivos
router.get('/:ticketId/attachments/stats', authenticate, ticketAttachmentsController.getStats as any);

export default router;
