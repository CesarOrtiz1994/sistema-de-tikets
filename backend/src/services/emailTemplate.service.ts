import prisma from '../config/database';
import logger from '../config/logger';

class EmailTemplateService {
  /**
   * Listar todos los email templates
   */
  async listTemplates() {
    return prisma.emailTemplate.findMany({
      orderBy: { code: 'asc' }
    });
  }

  /**
   * Obtener un template por ID
   */
  async getTemplateById(id: string) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new Error('Template no encontrado');
    }

    return template;
  }

  /**
   * Actualizar un template (subject, htmlBody, textBody, isActive)
   */
  async updateTemplate(id: string, data: {
    subject?: string;
    htmlBody?: string;
    textBody?: string;
    isActive?: boolean;
  }) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new Error('Template no encontrado');
    }

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.htmlBody !== undefined && { htmlBody: data.htmlBody }),
        ...(data.textBody !== undefined && { textBody: data.textBody }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });

    logger.info(`Email template updated: ${template.code} (${id})`);
    return updated;
  }

  /**
   * Preview: reemplazar variables en un template y devolver el HTML resultante
   */
  async previewTemplate(id: string, variables: Record<string, string>) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new Error('Template no encontrado');
    }

    let subject = template.subject;
    let htmlBody = template.htmlBody;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      subject = subject.replace(regex, value);
      htmlBody = htmlBody.replace(regex, value);
    }

    return {
      code: template.code,
      name: template.name,
      subject,
      htmlBody,
      variables: template.variables
    };
  }
}

export const emailTemplateService = new EmailTemplateService();
