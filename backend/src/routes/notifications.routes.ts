import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { auditAction } from '../middlewares/audit.middleware';
import { notificationsLimiter } from '../middlewares/rateLimiter.middleware';
import { notificationsController } from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);
router.use(notificationsLimiter);

// GET /api/notifications - Listar notificaciones del usuario
router.get(
  '/',
  notificationsController.listNotifications as any
);

// GET /api/notifications/unread-count - Conteo de no leídas
router.get(
  '/unread-count',
  notificationsController.getUnreadCount as any
);

// PUT /api/notifications/read-all - Marcar todas como leídas
router.put(
  '/read-all',
  notificationsController.markAllAsRead as any
);

// PUT /api/notifications/:id/read - Marcar una como leída
router.put(
  '/:id/read',
  notificationsController.markAsRead as any
);

// POST /api/notifications/register-token - Registrar token FCM
router.post(
  '/register-token',
  auditAction('REGISTER_FCM_TOKEN', 'fcm_token') as any,
  notificationsController.registerFcmToken as any
);

// DELETE /api/notifications/unregister-token - Eliminar token FCM
router.delete(
  '/unregister-token',
  auditAction('UNREGISTER_FCM_TOKEN', 'fcm_token') as any,
  notificationsController.unregisterFcmToken as any
);

export default router;
