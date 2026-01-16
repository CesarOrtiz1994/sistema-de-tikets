import { Request, Response, NextFunction } from 'express';
import fieldTypeService from '../services/fieldType.service';
import logger from '../config/logger';
import { FieldCategory } from '@prisma/client';

export class FieldTypeController {
  async getAllFieldTypes(req: Request, res: Response) {
    try {
      const { category } = req.query;

      let fieldTypes;
      if (category && typeof category === 'string') {
        fieldTypes = await fieldTypeService.getFieldTypesByCategory(category as FieldCategory);
      } else {
        fieldTypes = await fieldTypeService.getAllFieldTypes();
      }

      res.json(fieldTypes);
    } catch (error) {
      logger.error('Error getting field types:', error);
      res.status(500).json({ 
        message: 'Error al obtener tipos de campos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFieldTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const fieldType = await fieldTypeService.getFieldTypeById(id);

      if (!fieldType) {
        return res.status(404).json({ message: 'Tipo de campo no encontrado' });
      }

      return res.json(fieldType);
    } catch (error) {
      logger.error('Error getting field type:', error);
      return res.status(500).json({ 
        message: 'Error al obtener tipo de campo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createFieldType(req: Request, res: Response) {
    try {
      const fieldType = await fieldTypeService.createFieldType(req.body);
      res.status(201).json(fieldType);
    } catch (error) {
      logger.error('Error creating field type:', error);
      res.status(500).json({ 
        message: 'Error al crear tipo de campo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateFieldType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const fieldType = await fieldTypeService.updateFieldType(id, req.body);
      res.json(fieldType);
    } catch (error) {
      logger.error('Error updating field type:', error);
      res.status(500).json({ 
        message: 'Error al actualizar tipo de campo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteFieldType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await fieldTypeService.deleteFieldType(id);
      
      res.json({
        success: true,
        message: 'Field type deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFieldTypeValidations(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validations = await fieldTypeService.getFieldTypeValidations(id);
      
      res.json({
        success: true,
        data: validations
      });
    } catch (error) {
      next(error);
    }
  }

  async getFieldTypeStats(_req: Request, res: Response) {
    try {
      const stats = await fieldTypeService.getFieldTypeStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting field type stats:', error);
      res.status(500).json({ 
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new FieldTypeController();
