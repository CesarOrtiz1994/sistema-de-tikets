import { Router } from 'express';
import brandingController, { logoUpload } from '../controllers/branding.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin } from '../middlewares/permissions.middleware';
import { uploadLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Público - el login necesita el branding sin auth
router.get(
  '/',
  brandingController.getActiveBranding
);

// Solo SUPER_ADMIN
router.put(
  '/',
  authenticate,
  isSuperAdmin(),
  brandingController.updateBranding
);

// Upload de logo/imágenes (reutiliza uploadLimiter)
router.post(
  '/upload-logo',
  authenticate,
  isSuperAdmin(),
  uploadLimiter,
  logoUpload,
  brandingController.uploadLogo
);

export default router;
