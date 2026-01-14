import { Request, Response, NextFunction } from 'express';
import { RoleType } from '@prisma/client';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleType: RoleType;
  };
}

export const auditAction = (action: string, resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      const duration = Date.now() - startTime;
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';

      const auditData = {
        userId: req.user?.id,
        action,
        resource,
        resourceId: req.params.id || req.body.id || null,
        details: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          body: sanitizeBody(req.body),
          duration,
          statusCode: res.statusCode
        },
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
        status,
        errorMessage: status === 'error' ? body.message : null
      };

      prisma.auditLog.create({
        data: auditData
      }).catch((error: any) => {
        console.error('Error al crear log de auditoría:', error);
      });

      return originalJson(body);
    };

    next();
  };
};

function sanitizeBody(body: any): any {
  if (!body) return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

export const auditCriticalActions = () => {
  return auditAction('critical_action', 'system');
};
