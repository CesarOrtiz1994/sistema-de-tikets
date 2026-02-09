import { Request, Response } from 'express';
import { emailTemplateService } from '../services/emailTemplate.service';
import logger from '../config/logger';

class EmailTemplateController {
  /**
   * GET /api/email-templates
   * Listar todos los email templates
   */
  async listTemplates(_req: Request, res: Response) {
    try {
      const templates = await emailTemplateService.listTemplates();

      return res.json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      logger.error('Error listing email templates:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al listar templates'
      });
    }
  }

  /**
   * GET /api/email-templates/:id
   * Obtener un template por ID
   */
  async getTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await emailTemplateService.getTemplateById(id);

      return res.json({
        success: true,
        data: template
      });
    } catch (error: any) {
      logger.error('Error getting email template:', error);
      return res.status(404).json({
        success: false,
        error: error.message || 'Template no encontrado'
      });
    }
  }

  /**
   * PUT /api/email-templates/:id
   * Actualizar un template (Solo Super Admin)
   */
  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { subject, htmlBody, textBody, isActive } = req.body;

      const template = await emailTemplateService.updateTemplate(id, {
        subject,
        htmlBody,
        textBody,
        isActive
      });

      return res.json({
        success: true,
        message: 'Template actualizado exitosamente',
        data: template
      });
    } catch (error: any) {
      logger.error('Error updating email template:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar template'
      });
    }
  }

  /**
   * POST /api/email-templates/:id/preview
   * Preview de un template con variables de ejemplo
   */
  async previewTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { variables } = req.body;

      const preview = await emailTemplateService.previewTemplate(id, variables || {});

      return res.json({
        success: true,
        data: preview
      });
    } catch (error: any) {
      logger.error('Error previewing email template:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al generar preview'
      });
    }
  }
}

export const emailTemplateController = new EmailTemplateController();
