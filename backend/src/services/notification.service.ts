import { NotificationType } from '@prisma/client';
import prisma from '../config/database';
import { getIO } from '../config/socket';
import { emailService } from './email.service';
import { pushService } from './push.service';
import logger from '../config/logger';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

interface NotificationOptions {
  sendEmail?: boolean;
  emailTemplateCode?: string;
  emailVariables?: Record<string, string>;
  sendPush?: boolean;
  pushData?: Record<string, string>;
}

class NotificationService {
  /**
   * Crear y enviar una notificación (in-app + email + push)
   */
  async send(
    payload: NotificationPayload,
    options: NotificationOptions = {}
  ) {
    const { userId, type, title, message, data } = payload;
    const {
      sendEmail = false,
      emailTemplateCode,
      emailVariables,
      sendPush = false,
      pushData
    } = options;

    try {
      // 1. Crear notificación in-app en la base de datos
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data || {}
        }
      });

      // 2. Emitir via Socket.io en tiempo real
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: false,
          createdAt: notification.createdAt.toISOString()
        });
      } catch (socketError) {
        // Socket.io puede no estar inicializado en workers
        logger.debug('Socket.io not available for notification emit');
      }

      // 3. Enviar email si está habilitado
      if (sendEmail && emailTemplateCode) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true }
        });

        if (user) {
          const vars = {
            user_name: user.name,
            ...emailVariables
          };

          // Fire and forget - no bloquear la respuesta
          emailService.sendTemplateEmail(user.email, emailTemplateCode, vars).catch(err => {
            logger.error(`Failed to send email notification: ${err.message}`);
          });
        }
      }

      // 4. Enviar push notification si está habilitado
      if (sendPush) {
        const pData = {
          type: type.toString(),
          notificationId: notification.id,
          ...pushData
        };

        // Fire and forget
        pushService.sendToUser(userId, title, message, pData).catch(err => {
          logger.error(`Failed to send push notification: ${err.message}`);
        });
      }

      return notification;
    } catch (error) {
      logger.error(`Failed to create notification: userId=${userId}, type=${type}`, error);
      throw error;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  async sendToMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    options: NotificationOptions = {}
  ) {
    const results = [];
    for (const userId of userIds) {
      try {
        const notification = await this.send(
          { userId, type, title, message, data },
          options
        );
        results.push(notification);
      } catch (error) {
        logger.error(`Failed to send notification to userId=${userId}`, error);
      }
    }
    return results;
  }

  /**
   * Obtener notificaciones de un usuario con paginación
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para modificar esta notificación');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    return { count: result.count };
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  /**
   * Eliminar notificaciones antiguas (limpieza)
   */
  async cleanOldNotifications(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    });

    logger.info(`Cleaned ${result.count} old notifications (older than ${daysOld} days)`);
    return result.count;
  }
}

export const notificationService = new NotificationService();
