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

export const checkDepartmentAccess = (action: 'read' | 'write' | 'admin') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const departmentId = req.params.departmentId || req.body.departmentId;

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: 'ID de departamento requerido'
        });
      }

      const userRole = req.user.roleType;

      if (userRole === RoleType.SUPER_ADMIN) {
        return next();
      }

      const departmentUser = await prisma.departmentUser.findFirst({
        where: {
          departmentId,
          userId: req.user.id
        },
        include: {
          department: true
        }
      });

      if (!departmentUser) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este departamento'
        });
      }

      if (action === 'admin') {
        if (userRole !== RoleType.DEPT_ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'Solo los administradores de departamento pueden realizar esta acción'
          });
        }
      }

      if (action === 'write') {
        if (userRole === RoleType.REQUESTER) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos de escritura en este departamento'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error al verificar acceso al departamento:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar acceso al departamento'
      });
    }
  };
};
