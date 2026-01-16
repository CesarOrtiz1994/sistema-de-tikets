import { Request, Response } from 'express';
import slaConfigurationService from '../services/slaConfiguration.service';
import logger from '../config/logger';
import { SLAPriority } from '@prisma/client';

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
      const slaConfiguration = await slaConfigurationService.createSLAConfiguration(req.body);
      res.status(201).json(slaConfiguration);
    } catch (error) {
      logger.error('Error creating SLA configuration:', error);
      res.status(500).json({ 
        message: 'Error al crear configuración SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSLAConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const slaConfiguration = await slaConfigurationService.updateSLAConfiguration(id, req.body);
      res.json(slaConfiguration);
    } catch (error) {
      logger.error('Error updating SLA configuration:', error);
      res.status(500).json({ 
        message: 'Error al actualizar configuración SLA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteSLAConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await slaConfigurationService.deleteSLAConfiguration(id);
      return res.json({ message: 'Configuración SLA eliminada correctamente' });
    } catch (error) {
      logger.error('Error deleting SLA configuration:', error);
      
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
