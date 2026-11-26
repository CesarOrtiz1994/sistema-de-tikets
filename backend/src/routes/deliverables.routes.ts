import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { auditAction } from '../middlewares/audit.middleware';
import { deliverablesController } from '../controllers/deliverables.controller';

const router = Router();

const MAX_DELIVERABLE_FILES = 10;
const MAX_DELIVERABLE_FILE_SIZE_MB = 50;

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DELIVERABLE_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_DELIVERABLE_FILES
  }
});

const uploadDeliverableFiles = (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', MAX_DELIVERABLE_FILES)(req, res, (err: any) => {
    if (!err) return next();

    let error = 'Error al procesar los archivos';
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        error = `Cada archivo puede pesar máximo ${MAX_DELIVERABLE_FILE_SIZE_MB}MB`;
      } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = `Puedes subir máximo ${MAX_DELIVERABLE_FILES} archivos por entregable`;
      }
    }
    return res.status(400).json({ success: false, error });
  });
};

// POST /api/tickets/:ticketId/deliverables - Subir entregable (uno o varios archivos en el campo "files")
router.post(
  '/:ticketId/deliverables',
  authenticate,
  uploadDeliverableFiles,
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
