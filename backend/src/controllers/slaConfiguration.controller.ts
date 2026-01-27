import { Request, Response } from 'express';
import slaConfigurationService from '../services/slaConfiguration.service';
import logger from '../config/logger';
import { SLAPriority } from '@prisma/client';
import prisma from '../config/database';

export class SLAConfigurationController {
  async getAllSLAConfigurations(req: Request, res: Response) {
    try {
      const { priority } = req.query;

      let slaConfigurations;
      if (priority && typeof priority === 'string') {
        slaConfigurations = await slaConfigurationService.getSLAConfigurationsByPriority(priority as SLAPriority);
      } else {
        slaConfigurations = await slaConfigurationService.getAllSLAConfigurations();
      }

      res.json(slaConfigurations);
    } catch (error) {
      logger.error('Error getting SLA configurations:', error);
      res.status(500).json({ 
        message: 'Error al obtener configuraciones SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSLAConfigurationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const slaConfiguration = await slaConfigurationService.getSLAConfigurationById(id);

      if (!slaConfiguration) {
        return res.status(404).json({ message: 'Configuración SLA no encontrada' });
      }

      return res.json(slaConfiguration);
    } catch (error) {
      logger.error('Error getting SLA configuration:', error);
      return res.status(500).json({ 
        message: 'Error al obtener configuración SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDefaultSLAConfiguration(_req: Request, res: Response) {
    try {
      const slaConfiguration = await slaConfigurationService.getDefaultSLAConfiguration();

      if (!slaConfiguration) {
        return res.status(404).json({ message: 'No hay configuración SLA por defecto' });
      }

      return res.json(slaConfiguration);
    } catch (error) {
      logger.error('Error getting default SLA configuration:', error);
      return res.status(500).json({ 
        message: 'Error al obtener configuración SLA por defecto',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createSLAConfiguration(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const slaConfiguration = await slaConfigurationService.createSLAConfiguration(req.body);
      
      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_SLA_CONFIGURATION',
          resource: 'SLA_CONFIGURATION',
          resourceId: slaConfiguration.id,
          details: {
            name: req.body.name,
            priority: req.body.priority,
            responseTime: req.body.responseTime,
            resolutionTime: req.body.resolutionTime,
            isDefault: req.body.isDefault || false
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });
      
      res.status(201).json(slaConfiguration);
    } catch (error: any) {
      logger.error('Error creating SLA configuration:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CREATE_SLA_CONFIGURATION',
            resource: 'SLA_CONFIGURATION',
            resourceId: null,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      res.status(500).json({ 
        message: 'Error al crear configuración SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSLAConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const slaConfiguration = await slaConfigurationService.updateSLAConfiguration(id, req.body);
      
      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_SLA_CONFIGURATION',
          resource: 'SLA_CONFIGURATION',
          resourceId: id,
          details: {
            changes: req.body
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });
      
      res.json(slaConfiguration);
    } catch (error: any) {
      logger.error('Error updating SLA configuration:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_SLA_CONFIGURATION',
            resource: 'SLA_CONFIGURATION',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      res.status(500).json({ 
        message: 'Error al actualizar configuración SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteSLAConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      await slaConfigurationService.deleteSLAConfiguration(id);
      
      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_SLA_CONFIGURATION',
          resource: 'SLA_CONFIGURATION',
          resourceId: id,
          details: {
            message: 'Configuración SLA eliminada'
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });
      
      return res.json({ message: 'Configuración SLA eliminada correctamente' });
    } catch (error: any) {
      logger.error('Error deleting SLA configuration:', error);
      
      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'DELETE_SLA_CONFIGURATION',
            resource: 'SLA_CONFIGURATION',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }
      
      if (error instanceof Error && error.message.includes('por defecto')) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ 
        message: 'Error al eliminar configuración SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSLAStats(_req: Request, res: Response) {
    try {
      const stats = await slaConfigurationService.getSLAStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting SLA stats:', error);
      res.status(500).json({ 
        message: 'Error al obtener estadísticas SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new SLAConfigurationController();
