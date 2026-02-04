import { Router } from 'express';
import { chatAttachmentController, upload } from '../controllers/chatAttachment.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post(
  '/tickets/:ticketId/messages/upload',
  authenticate,
  upload.single('file'),
  chatAttachmentController.uploadAttachment
);

export default router;
