import api from './api';

export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  variables: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmailTemplateData {
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  isActive?: boolean;
}

export interface EmailTemplatePreview {
  code: string;
  name: string;
  subject: string;
  htmlBody: string;
  variables: string[] | null;
}

class EmailTemplatesService {
  async listTemplates(): Promise<EmailTemplate[]> {
    const response = await api.get('/api/email-templates');
    return response.data.data;
  }

  async getTemplate(id: string): Promise<EmailTemplate> {
    const response = await api.get(`/api/email-templates/${id}`);
    return response.data.data;
  }

  async updateTemplate(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplate> {
    const response = await api.put(`/api/email-templates/${id}`, data);
    return response.data.data;
  }

  async previewTemplate(id: string, variables: Record<string, string>): Promise<EmailTemplatePreview> {
    const response = await api.post(`/api/email-templates/${id}/preview`, { variables });
    return response.data.data;
  }
}

export const emailTemplatesService = new EmailTemplatesService();
