import { Request, Response } from 'express';
import ticketFormService from '../services/ticketForm.service';
import { cacheService } from '../services/cache.service';
import logger from '../config/logger';

export class TicketFormController {
  // ============================================
  // TICKET FORMS
  // ============================================

  async getDepartmentForms(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const forms = await ticketFormService.getDepartmentForms(id);
      
      return res.json({
        success: true,
        data: forms
      });
    } catch (error) {
      logger.error('Error getting department forms:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener formularios del departamento',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getActiveDepartmentForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cacheKey = `active:${id}`;
      const cached = await cacheService.getForm(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const form = await ticketFormService.getActiveDepartmentForm(id);
      await cacheService.setForm(cacheKey, form);
      
      return res.json({
        success: true,
        data: form
      });
    } catch (error) {
      logger.error('Error getting active department form:', error);
      
      if (error instanceof Error && error.message === 'No hay formulario activo para este departamento') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error al obtener formulario activo del departamento',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFormById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const form = await ticketFormService.getFormById(id);

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Formulario no encontrado'
        });
      }

      return res.json({
        success: true,
        data: form
      });
    } catch (error) {
      logger.error('Error getting form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener formulario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createForm(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const form = await ticketFormService.createForm(req.body, userId);
      await cacheService.invalidateForms(req.body.departmentId);
      
      return res.status(201).json({
        success: true,
        data: form,
        message: 'Formulario creado exitosamente'
      });
    } catch (error) {
      logger.error('Error creating form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear formulario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const form = await ticketFormService.updateForm(id, req.body, userId);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        data: form,
        message: 'Formulario actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error updating form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar formulario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      await ticketFormService.deleteForm(id, userId);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        message: 'Formulario eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error deleting form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar formulario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async setDefaultForm(req: Request, res: Response) {
    try {
      const { departmentId, formId } = req.params;
      const form = await ticketFormService.setDefaultForm(departmentId, formId);
      await cacheService.invalidateForms(departmentId);
      
      return res.json({
        success: true,
        data: form,
        message: 'Formulario establecido como predeterminado'
      });
    } catch (error) {
      logger.error('Error setting default form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al establecer formulario predeterminado',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async duplicateForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = (req as any).user.id;
      const form = await ticketFormService.duplicateForm(id, name, userId);
      
      return res.status(201).json({
        success: true,
        data: form,
        message: 'Formulario duplicado exitosamente'
      });
    } catch (error) {
      logger.error('Error duplicating form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al duplicar formulario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async activateForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { incrementVersion } = req.body;
      const userId = (req as any).user.id;
      
      const form = await ticketFormService.activateForm(id, userId, incrementVersion);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        data: form,
        message: 'Formulario activado exitosamente'
      });
    } catch (error) {
      logger.error('Error activating form:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error al activar formulario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============================================
  // FORM FIELDS
  // ============================================

  async addFieldToForm(req: Request, res: Response) {
    try {
      const field = await ticketFormService.addFieldToForm(req.body);
      await cacheService.invalidateForms();
      
      return res.status(201).json({
        success: true,
        data: field,
        message: 'Campo agregado exitosamente'
      });
    } catch (error) {
      logger.error('Error adding field to form:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al agregar campo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateFormField(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const field = await ticketFormService.updateFormField(id, req.body);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        data: field,
        message: 'Campo actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error updating form field:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar campo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteFormField(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ticketFormService.deleteFormField(id);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        message: 'Campo eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error deleting form field:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar campo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async reorderFormFields(req: Request, res: Response) {
    try {
      const { formId } = req.params;
      const { fieldOrders } = req.body;
      
      await ticketFormService.reorderFormFields(formId, fieldOrders);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        message: 'Campos reordenados exitosamente'
      });
    } catch (error) {
      logger.error('Error reordering form fields:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al reordenar campos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============================================
  // FIELD OPTIONS
  // ============================================

  async addFieldOption(req: Request, res: Response) {
    try {
      const option = await ticketFormService.addFieldOption(req.body);
      await cacheService.invalidateForms();
      
      return res.status(201).json({
        success: true,
        data: option,
        message: 'Opción agregada exitosamente'
      });
    } catch (error) {
      logger.error('Error adding field option:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al agregar opción',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateFieldOption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const option = await ticketFormService.updateFieldOption(id, req.body);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        data: option,
        message: 'Opción actualizada exitosamente'
      });
    } catch (error) {
      logger.error('Error updating field option:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar opción',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteFieldOption(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ticketFormService.deleteFieldOption(id);
      await cacheService.invalidateForms();
      
      return res.json({
        success: true,
        message: 'Opción eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error deleting field option:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar opción',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async bulkCreateFieldOptions(req: Request, res: Response) {
    try {
      const { fieldId } = req.params;
      const { options } = req.body;
      
      await ticketFormService.bulkCreateFieldOptions(fieldId, options);
      await cacheService.invalidateForms();
      
      return res.status(201).json({
        success: true,
        message: 'Opciones creadas exitosamente'
      });
    } catch (error) {
      logger.error('Error bulk creating field options:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear opciones',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============================================
  // STATS
  // ============================================

  async getFormStats(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;
      const stats = await ticketFormService.getFormStats(departmentId);
      
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting form stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new TicketFormController();
