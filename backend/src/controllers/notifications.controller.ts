import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { pushService } from '../services/push.service';
import { notificationValidators } from '../validators/notification.validator';
import logger from '../config/logger';

export class NotificationsController {
  /**
   * GET /api/notifications
   * Listar notificaciones del usuario autenticado
   */
  async listNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const validation = notificationValidators.listNotifications.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros inválidos',
          details: validation.error.issues
        });
      }

      const { page, limit, unreadOnly } = validation.data;

      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit,
        unreadOnly
      );

      return res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount
      });
    } catch (error: any) {
      logger.error('Error en listNotifications:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener notificaciones'
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.getUnreadCount(userId);

      return res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error: any) {
      logger.error('Error en getUnreadCount:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener conteo'
      });
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Marcar una notificación como leída
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const validation = notificationValidators.markAsRead.safeParse(req.params);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.error.issues
        });
      }

      const notification = await notificationService.markAsRead(
        validation.data.id,
        userId
      );

      return res.json({
        success: true,
        data: notification
      });
    } catch (error: any) {
      logger.error('Error en markAsRead:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al marcar como leída'
      });
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error en markAllAsRead:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al marcar todas como leídas'
      });
    }
  }

  /**
   * POST /api/notifications/register-token
   * Registrar token FCM para push notifications
   */
  async registerFcmToken(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const validation = notificationValidators.registerFcmToken.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: validation.error.issues
        });
      }

      const { token, device } = validation.data;
      await pushService.registerToken(userId, token, device);

      return res.json({
        success: true,
        message: 'Token FCM registrado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error en registerFcmToken:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al registrar token'
      });
    }
  }

  /**
   * DELETE /api/notifications/unregister-token
   * Eliminar token FCM
   */
  async unregisterFcmToken(req: Request, res: Response) {
    try {
      const validation = notificationValidators.unregisterFcmToken.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: validation.error.issues
        });
      }

      const { token } = validation.data;
      await pushService.unregisterToken(token);

      return res.json({
        success: true,
        message: 'Token FCM eliminado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error en unregisterFcmToken:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar token'
      });
    }
  }
}

export const notificationsController = new NotificationsController();
