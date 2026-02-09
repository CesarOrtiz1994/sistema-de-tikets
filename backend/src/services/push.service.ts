import admin from 'firebase-admin';
import { env } from '../config/env';
import logger from '../config/logger';
import prisma from '../config/database';

class PushService {
  private initialized = false;
  private enabled = false;

  /**
   * Inicializar Firebase Admin SDK
   */
  private initialize() {
    if (this.initialized) return;

    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
      logger.warn('Firebase credentials not configured. Push service disabled.');
      this.initialized = true;
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          privateKey: env.FIREBASE_PRIVATE_KEY,
          clientEmail: env.FIREBASE_CLIENT_EMAIL
        })
      });

      this.enabled = true;
      this.initialized = true;
      logger.info('Firebase Admin SDK initialized');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.initialized = true;
    }
  }

  /**
   * Registrar token FCM para un usuario
   */
  async registerToken(userId: string, token: string, device: string = 'web') {
    // Upsert: si el token ya existe, actualizar el userId
    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId, device, updatedAt: new Date() },
      create: { userId, token, device }
    });

    logger.info(`FCM token registered: userId=${userId}, device=${device}`);
  }

  /**
   * Eliminar token FCM
   */
  async unregisterToken(token: string) {
    await prisma.fcmToken.deleteMany({
      where: { token }
    });

    logger.info(`FCM token unregistered: token=${token.substring(0, 20)}...`);
  }

  /**
   * Eliminar todos los tokens de un usuario
   */
  async unregisterAllTokens(userId: string) {
    await prisma.fcmToken.deleteMany({
      where: { userId }
    });

    logger.info(`All FCM tokens unregistered for userId=${userId}`);
  }

  /**
   * Enviar push notification a un usuario específico
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<number> {
    this.initialize();
    if (!this.enabled) {
      logger.warn(`Push not sent (Firebase disabled): userId=${userId}, title=${title}`);
      return 0;
    }

    try {
      // Obtener todos los tokens del usuario
      const tokens = await prisma.fcmToken.findMany({
        where: { userId },
        select: { token: true, id: true }
      });

      if (tokens.length === 0) {
        logger.debug(`No FCM tokens found for userId=${userId}`);
        return 0;
      }

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens.map(t => t.token),
        notification: {
          title,
          body
        },
        data: data || {},
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: data?.type || 'default'
          },
          fcmOptions: {
            link: data?.url || '/'
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Limpiar tokens inválidos
      if (response.failureCount > 0) {
        const invalidTokenIds: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              invalidTokenIds.push(tokens[idx].id);
            }
          }
        });

        if (invalidTokenIds.length > 0) {
          await prisma.fcmToken.deleteMany({
            where: { id: { in: invalidTokenIds } }
          });
          logger.info(`Cleaned ${invalidTokenIds.length} invalid FCM tokens for userId=${userId}`);
        }
      }

      logger.info(`Push sent: userId=${userId}, success=${response.successCount}, failures=${response.failureCount}`);
      return response.successCount;
    } catch (error) {
      logger.error(`Failed to send push: userId=${userId}`, error);
      return 0;
    }
  }

  /**
   * Enviar push notification a múltiples usuarios
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<number> {
    let totalSent = 0;
    for (const userId of userIds) {
      totalSent += await this.sendToUser(userId, title, body, data);
    }
    return totalSent;
  }
}

export const pushService = new PushService();
