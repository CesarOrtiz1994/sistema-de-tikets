import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { auditAction } from '../middlewares/audit.middleware';
import { notificationsController } from '../controllers/notifications.controller';

const router = Router();

// GET /api/notifications - Listar notificaciones del usuario
router.get(
  '/',
  authenticate,
  notificationsController.listNotifications as any
);

// GET /api/notifications/unread-count - Conteo de no leídas
router.get(
  '/unread-count',
  authenticate,
  notificationsController.getUnreadCount as any
);

// PUT /api/notifications/read-all - Marcar todas como leídas
router.put(
  '/read-all',
  authenticate,
  notificationsController.markAllAsRead as any
);

// PUT /api/notifications/:id/read - Marcar una como leída
router.put(
  '/:id/read',
  authenticate,
  notificationsController.markAsRead as any
);

// POST /api/notifications/register-token - Registrar token FCM
router.post(
  '/register-token',
  authenticate,
  auditAction('REGISTER_FCM_TOKEN', 'fcm_token') as any,
  notificationsController.registerFcmToken as any
);

// DELETE /api/notifications/unregister-token - Eliminar token FCM
router.delete(
  '/unregister-token',
  authenticate,
  auditAction('UNREGISTER_FCM_TOKEN', 'fcm_token') as any,
  notificationsController.unregisterFcmToken as any
);

export default router;
