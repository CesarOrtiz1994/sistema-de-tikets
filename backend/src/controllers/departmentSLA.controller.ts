import { Request, Response, NextFunction } from 'express';
import departmentSLAService from '../services/departmentSLA.service';
import { SLAPriority } from '@prisma/client';

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
      const { slaConfigurationId, priority, isDefault } = req.body;

      if (!slaConfigurationId || !priority) {
        return res.status(400).json({
          success: false,
          message: 'slaConfigurationId and priority are required'
        });
      }

      const result = await departmentSLAService.assignSLAToDepartment({
        departmentId: id,
        slaConfigurationId,
        priority: priority as SLAPriority,
        isDefault
      });

      return res.json({
        success: true,
        data: result,
        message: 'SLA configuration assigned to department successfully'
      });
    } catch (error) {
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

      const result = await departmentSLAService.removeSLAFromDepartment(
        id,
        priority as SLAPriority
      );

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
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
}

export default new DepartmentSLAController();
