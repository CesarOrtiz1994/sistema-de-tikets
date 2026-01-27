import { Request, Response, NextFunction } from 'express';
import departmentWorkScheduleService from '../services/departmentWorkSchedule.service';
import logger from '../config/logger';
import prisma from '../config/database';

class DepartmentWorkScheduleController {
  /**
   * Obtiene el horario laboral de un departamento
   */
  async getDepartmentSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const schedules = await departmentWorkScheduleService.getDepartmentSchedule(id);
      
      return res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      logger.error('Error getting department schedule:', error);
      return next(error);
    }
  }

  /**
   * Configura el horario laboral completo de un departamento
   * Solo DEPT_ADMIN del departamento puede hacerlo
   */
  async setDepartmentSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { schedules } = req.body;
      const userId = (req as any).user?.id;

      if (!schedules || !Array.isArray(schedules)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de horarios (schedules)'
        });
      }

      const result = await departmentWorkScheduleService.setDepartmentSchedule(id, schedules);

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CONFIGURE_WORK_SCHEDULE',
          resource: 'DEPARTMENT_WORK_SCHEDULE',
          resourceId: id,
          details: {
            schedules: schedules.map(s => ({
              day: s.dayOfWeek,
              isWorkday: s.isWorkday,
              hours: s.isWorkday ? `${s.startHour}:${s.startMinute || 0}-${s.endHour}:${s.endMinute || 0}` : 'No laboral'
            }))
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: result,
        message: 'Horario laboral configurado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error setting department schedule:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CONFIGURE_WORK_SCHEDULE',
            resource: 'DEPARTMENT_WORK_SCHEDULE',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      if (error.message.includes('Debe proporcionar') || error.message.includes('Cada día')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return next(error);
    }
  }

  /**
   * Actualiza el horario de un día específico
   */
  async updateDaySchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, day } = req.params;
      const scheduleData = req.body;
      const userId = (req as any).user?.id;
      const dayOfWeek = parseInt(day);

      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message: 'El día debe ser un número entre 0 (Domingo) y 6 (Sábado)'
        });
      }

      const result = await departmentWorkScheduleService.updateDaySchedule(
        id,
        dayOfWeek,
        scheduleData
      );

      // Auditoría
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_DAY_SCHEDULE',
          resource: 'DEPARTMENT_WORK_SCHEDULE',
          resourceId: id,
          details: {
            day: dayNames[dayOfWeek],
            dayOfWeek,
            isWorkday: scheduleData.isWorkday,
            hours: scheduleData.isWorkday 
              ? `${scheduleData.startHour}:${scheduleData.startMinute || 0}-${scheduleData.endHour}:${scheduleData.endMinute || 0}`
              : 'No laboral'
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: result,
        message: 'Horario del día actualizado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error updating day schedule:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_DAY_SCHEDULE',
            resource: 'DEPARTMENT_WORK_SCHEDULE',
            resourceId: req.params.id,
            details: { error: error.message, day: req.params.day },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      if (error.message.includes('debe estar') || error.message.includes('debe ser')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return next(error);
    }
  }

  /**
   * Resetea el horario a default (elimina configuración personalizada)
   */
  async resetToDefaultSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      await departmentWorkScheduleService.resetToDefaultSchedule(id);

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'RESET_WORK_SCHEDULE',
          resource: 'DEPARTMENT_WORK_SCHEDULE',
          resourceId: id,
          details: {
            message: 'Horario reseteado a configuración por defecto (Lunes-Viernes 9:00-18:00)'
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        message: 'Horario reseteado a configuración por defecto (Lunes-Viernes 9:00-18:00)'
      });
    } catch (error: any) {
      logger.error('Error resetting schedule:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'RESET_WORK_SCHEDULE',
            resource: 'DEPARTMENT_WORK_SCHEDULE',
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

  /**
   * Verifica si un departamento tiene horario personalizado
   */
  async hasCustomSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const hasCustom = await departmentWorkScheduleService.hasCustomSchedule(id);

      return res.json({
        success: true,
        data: { hasCustomSchedule: hasCustom }
      });
    } catch (error) {
      logger.error('Error checking custom schedule:', error);
      return next(error);
    }
  }
}

export default new DepartmentWorkScheduleController();
