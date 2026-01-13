import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../config/logger';
import { env } from '../config/env';

// Middleware para manejar errores 404
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Ruta no encontrada: ${req.method} ${req.path}`, 404);
  next(error);
};

// Middleware global de manejo de errores
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log del error
  if (err instanceof AppError && err.isOperational) {
    logger.warn('Error operacional:', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error('Error no manejado:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Determinar código de estado
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Preparar respuesta de error
  const errorResponse: {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
    stack?: string;
  } = {
    success: false,
    message: err.message || 'Error interno del servidor',
  };

  // Agregar errores de validación si existen
  if (err instanceof ValidationError) {
    errorResponse.errors = err.errors;
  }

  // Incluir stack trace solo en desarrollo
  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar errores asíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
