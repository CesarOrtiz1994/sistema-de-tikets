import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { auditAction } from '../middlewares/audit.middleware';
import { deliverablesController } from '../controllers/deliverables.controller';

const router = Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  }
});

// POST /api/tickets/:ticketId/deliverables - Subir entregable
router.post(
  '/:ticketId/deliverables',
  authenticate,
  upload.single('file'),
  auditAction('UPLOAD_DELIVERABLE', 'deliverable') as any,
  deliverablesController.uploadDeliverable as any
);

// GET /api/tickets/:ticketId/deliverables - Obtener entregables del ticket
router.get(
  '/:ticketId/deliverables',
  authenticate,
  deliverablesController.getTicketDeliverables as any
);

// POST /api/deliverables/:id/approve - Aprobar entregable
router.post(
  '/deliverables/:id/approve',
  authenticate,
  auditAction('APPROVE_DELIVERABLE', 'deliverable') as any,
  deliverablesController.approveDeliverable as any
);

// POST /api/deliverables/:id/reject - Rechazar entregable
router.post(
  '/deliverables/:id/reject',
  authenticate,
  auditAction('REJECT_DELIVERABLE', 'deliverable') as any,
  deliverablesController.rejectDeliverable as any
);

export default router;
