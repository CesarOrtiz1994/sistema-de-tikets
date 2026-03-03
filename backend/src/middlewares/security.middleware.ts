import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { 
  rateLimitOptions, 
  authRateLimitOptions,
  chatMessageRateLimitOptions,
  chatAttachmentRateLimitOptions
} from '../config/security';

// Helmet middleware para seguridad de headers HTTP
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Rate limiter general
export const generalRateLimiter = rateLimit(rateLimitOptions);

// Rate limiter para rutas de autenticación
export const authRateLimiter = rateLimit(authRateLimitOptions);

// Rate limiter para mensajes de chat
export const chatMessageRateLimiter = rateLimit(chatMessageRateLimitOptions);

// Rate limiter para archivos adjuntos de chat
export const chatAttachmentRateLimiter = rateLimit(chatAttachmentRateLimitOptions);

// Middleware para validar tamaño de body
export const bodySizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 100 * 1024 * 1024; // 100 MB

  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    res.status(413).json({
      success: false,
      message: 'El tamaño del contenido excede el límite permitido (100 MB)',
    });
    return;
  }

  next();
};
