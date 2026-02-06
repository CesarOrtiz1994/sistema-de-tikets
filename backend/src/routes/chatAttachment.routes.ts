import { Router } from 'express';
import { chatAttachmentController, upload } from '../controllers/chatAttachment.controller';
import { authenticate } from '../middlewares/auth';
import { chatAttachmentRateLimiter } from '../middlewares/security.middleware';

const router = Router();

router.post(
  '/tickets/:ticketId/messages/upload',
  authenticate,
  chatAttachmentRateLimiter,
  upload.single('file'),
  chatAttachmentController.uploadAttachment as any
);

export default router;
