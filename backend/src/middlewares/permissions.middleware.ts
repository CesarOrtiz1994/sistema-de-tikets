import { Request, Response, NextFunction } from 'express';
import { RoleType } from '@prisma/client';

export const checkPermission = (...allowedRoles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const userRole = (req.user as any).roleType;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción',
          requiredRoles: allowedRoles,
          userRole
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
};

export const isSuperAdmin = () => {
  return checkPermission(RoleType.SUPER_ADMIN);
};

export const isDeptAdmin = () => {
  return checkPermission(RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN);
};

export const isSubordinate = () => {
  return checkPermission(RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN, RoleType.SUBORDINATE);
};

export const isAuthenticated = () => {
  return checkPermission(
    RoleType.SUPER_ADMIN,
    RoleType.DEPT_ADMIN,
    RoleType.SUBORDINATE,
    RoleType.REQUESTER
  );
};
