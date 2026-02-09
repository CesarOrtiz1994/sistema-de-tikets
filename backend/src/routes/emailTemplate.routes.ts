import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin } from '../middlewares/permissions.middleware';
import { emailTemplateController } from '../controllers/emailTemplate.controller';

const router = Router();

// Todas las rutas requieren autenticación + Super Admin
router.use(authenticate);
router.use(isSuperAdmin() as any);

// GET /api/email-templates - Listar templates
router.get(
  '/',
  emailTemplateController.listTemplates as any
);

// GET /api/email-templates/:id - Obtener template por ID
router.get(
  '/:id',
  emailTemplateController.getTemplate as any
);

// PUT /api/email-templates/:id - Actualizar template
router.put(
  '/:id',
  emailTemplateController.updateTemplate as any
);

// POST /api/email-templates/:id/preview - Preview con variables
router.post(
  '/:id/preview',
  emailTemplateController.previewTemplate as any
);

export default router;
