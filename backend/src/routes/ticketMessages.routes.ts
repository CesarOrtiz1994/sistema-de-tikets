import { Router } from 'express';
import { ticketMessagesController } from '../controllers/ticketMessages.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/tickets/:ticketId/messages', authenticate, ticketMessagesController.getMessages);
router.post('/tickets/:ticketId/messages', authenticate, ticketMessagesController.createMessage);
router.delete('/messages/:messageId', authenticate, ticketMessagesController.deleteMessage);

export default router;
