import { z } from 'zod';

export const notificationValidators = {
  // Listar notificaciones con paginación
  listNotifications: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unreadOnly: z.coerce.boolean().optional().default(false)
  }),

  // Marcar una notificación como leída
  markAsRead: z.object({
    id: z.string().uuid('El ID de la notificación debe ser un UUID válido')
  }),

  // Registrar token FCM
  registerFcmToken: z.object({
    token: z.string().min(1, 'El token FCM es requerido'),
    device: z.enum(['web', 'android', 'ios']).optional().default('web')
  }),

  // Eliminar token FCM
  unregisterFcmToken: z.object({
    token: z.string().min(1, 'El token FCM es requerido')
  })
};
