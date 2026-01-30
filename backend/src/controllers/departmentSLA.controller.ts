import { Request, Response, NextFunction } from 'express';
import departmentSLAService from '../services/departmentSLA.service';
import { SLAPriority } from '@prisma/client';
import prisma from '../config/database';
import logger from '../config/logger';

class DepartmentSLAController {
  async getDepartmentSLAs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const slaConfigs = await departmentSLAService.getDepartmentSLAConfigurations(id);
      
      res.json({
        success: true,
        data: slaConfigs
      });
    } catch (error) {
      next(error);
    }
  }

  async assignSLAToDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        slaConfigurationId, 
        priority, 
        isDefault,
        // Campos para crear SLA completo
        name,
        description,
        responseTime,
        resolutionTime,
        businessHoursOnly,
        escalationEnabled,
        escalationTime,
        notifyOnBreach,
        notifyBefore
      } = req.body;

      if (!priority) {
        return res.status(400).json({
          success: false,
          message: 'priority is required'
        });
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.roleType;

      // Si es DEPT_ADMIN, verificar que sea admin de este departamento
      if (userRole === 'DEPT_ADMIN') {
        const departmentUser = await prisma.departmentUser.findFirst({
          where: {
            departmentId: id,
            userId: userId,
            role: 'ADMIN'
          }
        });

        if (!departmentUser) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para configurar SLA de este departamento'
          });
        }
      }
      // Si se proporciona slaConfigurationId, usar el método antiguo
      // Si se proporcionan los campos completos, crear SLA directamente
      let result;
      if (slaConfigurationId) {
        result = await departmentSLAService.assignSLAToDepartment({
          departmentId: id,
          slaConfigurationId,
          priority: priority as SLAPriority,
          isDefault
        });
      } else if (name && responseTime && resolutionTime) {
        // Crear configuración SLA completa
        result = await departmentSLAService.createDepartmentSLADirect({
          departmentId: id,
          priority: priority as SLAPriority,
          name,
          description,
          responseTime,
          resolutionTime,
          businessHoursOnly: businessHoursOnly ?? true,
          escalationEnabled: escalationEnabled ?? false,
          escalationTime,
          notifyOnBreach: notifyOnBreach ?? true,
          notifyBefore,
          isDefault: isDefault ?? false
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either slaConfigurationId or complete SLA configuration (name, responseTime, resolutionTime) is required'
        });
      }

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'ASSIGN_SLA_TO_DEPARTMENT',
          resource: 'DEPARTMENT_SLA',
          resourceId: id,
          details: {
            slaConfigurationId: slaConfigurationId || 'direct',
            priority,
            name,
            isDefault: isDefault || false
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: result,
        message: 'SLA configuration assigned to department successfully'
      });
    } catch (error: any) {
      logger.error('Error assigning SLA to department:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'ASSIGN_SLA_TO_DEPARTMENT',
            resource: 'DEPARTMENT_SLA',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      return next(error);
    }
  }

  async removeSLAFromDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, priority } = req.params;

      if (!priority) {
        return res.status(400).json({
          success: false,
          message: 'Priority is required'
        });
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.roleType;

      // Si es DEPT_ADMIN, verificar que sea admin de este departamento
      if (userRole === 'DEPT_ADMIN') {
        const departmentUser = await prisma.departmentUser.findFirst({
          where: {
            departmentId: id,
            userId: userId,
            role: 'ADMIN'
          }
        });

        if (!departmentUser) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para configurar SLA de este departamento'
          });
        }
      }

      const result = await departmentSLAService.removeSLAFromDepartment(
        id,
        priority as SLAPriority
      );

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REMOVE_SLA_FROM_DEPARTMENT',
          resource: 'DEPARTMENT_SLA',
          resourceId: id,
          details: {
            priority
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error removing SLA from department:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'REMOVE_SLA_FROM_DEPARTMENT',
            resource: 'DEPARTMENT_SLA',
            resourceId: req.params.id,
            details: { error: error.message, priority: req.params.priority },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      return next(error);
    }
  }

  async getDefaultSLA(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const defaultSLA = await departmentSLAService.getDefaultSLAForDepartment(id);
      
      res.json({
        success: true,
        data: defaultSLA
      });
    } catch (error) {
      next(error);
    }
  }

  async getSLAForDepartmentAndPriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, priority } = req.params;

      if (!priority) {
        return res.status(400).json({
          success: false,
          message: 'Priority is required'
        });
      }

      const sla = await departmentSLAService.getSLAForDepartmentAndPriority(
        id,
        priority as SLAPriority
      );

      return res.json({
        success: true,
        data: sla
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new DepartmentSLAController();
