import rateLimit from 'express-rate-limit';

/**
 * Rate limiter general para la API
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  // No usar keyGenerator personalizado para evitar problemas con IPv6
});

/**
 * Rate limiter estricto para autenticación
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login
  message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos',
  skipSuccessfulRequests: true, // No contar requests exitosos
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para uploads de archivos
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 uploads por minuto
  message: 'Demasiados archivos subidos, por favor espera un momento antes de continuar',
  standardHeaders: true,
  legacyHeaders: false,
  // Usar keyGenerator por defecto (basado en IP)
});

/**
 * Rate limiter para creación de formularios
 */
export const formCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 formularios por hora
  message: 'Has alcanzado el límite de creación de formularios por hora',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para duplicación de formularios
 */
export const formDuplicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 duplicaciones por hora
  message: 'Has alcanzado el límite de duplicación de formularios por hora',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para operaciones de campos (agregar/editar/eliminar)
 */
export const fieldOperationsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 operaciones por minuto
  message: 'Demasiadas operaciones en formularios, por favor espera un momento',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para eliminación de recursos
 */
export const deletionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 eliminaciones por minuto
  message: 'Demasiadas operaciones de eliminación, por favor espera un momento',
  standardHeaders: true,
  legacyHeaders: false,
});
