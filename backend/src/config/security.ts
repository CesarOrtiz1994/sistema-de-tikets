import { CorsOptions } from 'cors';
import { Options as RateLimitOptions } from 'express-rate-limit';
import { env } from './env';

// Configuración de CORS
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = env.FRONTEND_URL.split(',');
    
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 horas
};

// Configuración de Rate Limiting
export const rateLimitOptions: Partial<RateLimitOptions> = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'development' ? 1000 : 100, // Más permisivo en desarrollo
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip para health checks y en desarrollo para localhost
    if (req.path === '/api/health') return true;
    if (env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  },
};

// Rate limit más estricto para autenticación
export const authRateLimitOptions: Partial<RateLimitOptions> = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'development' ? 100 : 5, // Más permisivo en desarrollo
  message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip en desarrollo para localhost
    if (env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  },
};
