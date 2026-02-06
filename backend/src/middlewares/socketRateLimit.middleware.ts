import { Socket } from 'socket.io';
import logger from '../config/logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface UserRateLimit {
  count: number;
  resetTime: number;
}

/**
 * Rate limiter para eventos de Socket.IO
 * Limita la cantidad de eventos que un usuario puede emitir en una ventana de tiempo
 */
export class SocketRateLimiter {
  private limits: Map<string, UserRateLimit> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Limpiar límites expirados cada minuto
    setInterval(() => {
      this.cleanupExpiredLimits();
    }, 60000);
  }

  /**
   * Verifica si el usuario puede realizar la acción
   * @param userId ID del usuario
   * @returns true si puede continuar, false si excedió el límite
   */
  checkLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Primera petición o ventana expirada, crear nuevo límite
      this.limits.set(userId, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (userLimit.count >= this.config.maxRequests) {
      // Límite excedido
      logger.warn(`[SocketRateLimit] User ${userId} exceeded rate limit`);
      return false;
    }

    // Incrementar contador
    userLimit.count++;
    return true;
  }

  /**
   * Limpia los límites expirados del mapa
   */
  private cleanupExpiredLimits(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.limits.forEach((limit, userId) => {
      if (now > limit.resetTime) {
        expiredKeys.push(userId);
      }
    });

    expiredKeys.forEach(key => this.limits.delete(key));
    
    if (expiredKeys.length > 0) {
      logger.debug(`[SocketRateLimit] Cleaned up ${expiredKeys.length} expired limits`);
    }
  }

  /**
   * Obtiene el tiempo restante hasta que se resetee el límite
   * @param userId ID del usuario
   * @returns Segundos restantes hasta el reset, o 0 si no hay límite activo
   */
  getTimeUntilReset(userId: string): number {
    const userLimit = this.limits.get(userId);
    if (!userLimit) return 0;

    const now = Date.now();
    const remaining = Math.max(0, userLimit.resetTime - now);
    return Math.ceil(remaining / 1000);
  }
}

// Configuraciones de rate limiting para diferentes eventos
export const messageRateLimiter = new SocketRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10, // 10 mensajes por minuto
});

export const typingRateLimiter = new SocketRateLimiter({
  windowMs: 1000, // 1 segundo
  maxRequests: 5, // 5 eventos de typing por segundo
});

export const joinLeaveRateLimiter = new SocketRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 20, // 20 join/leave por minuto
});

/**
 * Middleware para aplicar rate limiting a eventos de Socket.IO
 */
export function createSocketRateLimitMiddleware(limiter: SocketRateLimiter) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const userId = (socket as any).userId;
    
    if (!userId) {
      // Si no hay userId, permitir (el auth middleware debería haber bloqueado antes)
      return next();
    }

    if (!limiter.checkLimit(userId)) {
      const retryAfter = limiter.getTimeUntilReset(userId);
      const error = new Error('Rate limit exceeded');
      (error as any).data = {
        message: 'Estás realizando esta acción demasiado rápido. Por favor espera un momento.',
        retryAfter,
      };
      return next(error);
    }

    next();
  };
}
