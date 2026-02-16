import api from './api';

export interface TicketForm {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  fields?: FormField[];
}

export interface FormField {
  id: string;
  formId: string;
  fieldTypeId: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isVisible: boolean;
  order: number;
  row?: number;
  columnInRow?: number;
  defaultValue?: string;
  validationRules?: any;
  validations?: any;
  conditionalLogic?: any;
  columnSpan?: 1 | 2 | 3;
  fieldType?: {
    id: string;
    name: string;
    code: string;
    category: string;
    icon?: string;
  };
  options?: FieldOption[];
}

export interface FieldOption {
  id: string;
  fieldId: string;
  label: string;
  value: string;
  order: number;
  isDefault: boolean;
}

export interface CreateFormData {
  departmentId: string;
  name: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isDefault?: boolean;
}

export interface UpdateFormData {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isDefault?: boolean;
}

export interface CreateFieldData {
  formId: string;
  fieldTypeId: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  order?: number;
  defaultValue?: string;
  validationRules?: any;
}

export interface UpdateFieldData {
  label?: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  order?: number;
  row?: number;
  columnInRow?: number;
  defaultValue?: string;
  columnSpan?: 1 | 2 | 3;
  validationRules?: any;
  options?: Array<{
    id?: string;
    label: string;
    value: string;
    order: number;
    isDefault: boolean;
  }>;
}

class FormsService {
  async getDepartmentForms(departmentId: string): Promise<TicketForm[]> {
    const response = await api.get(`/api/forms/departments/${departmentId}/forms`);
    return response.data.data;
  }

  async getFormById(id: string): Promise<TicketForm> {
    const response = await api.get(`/api/forms/${id}`);
    return response.data.data;
  }

  async createForm(data: CreateFormData): Promise<TicketForm> {
    const response = await api.post('/api/forms', data);
    return response.data.data;
  }

  async updateForm(id: string, data: UpdateFormData): Promise<TicketForm> {
    const response = await api.put(`/api/forms/${id}`, data);
    return response.data.data;
  }

  async deleteForm(id: string): Promise<void> {
    await api.delete(`/api/forms/${id}`);
  }

  async setDefaultForm(departmentId: string, formId: string): Promise<TicketForm> {
    const response = await api.put(`/api/forms/departments/${departmentId}/forms/${formId}/default`);
    return response.data.data;
  }

  async duplicateForm(id: string, name: string): Promise<TicketForm> {
    const response = await api.post(`/api/forms/${id}/duplicate`, { name });
    return response.data.data;
  }

  async addField(data: CreateFieldData): Promise<FormField> {
    const response = await api.post('/api/forms/fields', data);
    return response.data.data;
  }

  async updateField(id: string, data: UpdateFieldData): Promise<FormField> {
    const response = await api.put(`/api/forms/fields/${id}`, data);
    return response.data.data;
  }

  async activateForm(formId: string, incrementVersion: boolean = false): Promise<TicketForm> {
    const response = await api.put(`/api/forms/${formId}/activate`, { incrementVersion });
    return response.data.data;
  }

  async deleteField(id: string): Promise<void> {
    await api.delete(`/api/forms/fields/${id}`);
  }

  async reorderFields(formId: string, fieldOrders: { id: string; order: number }[]): Promise<void> {
    await api.put(`/api/forms/${formId}/fields/reorder`, { fieldOrders });
  }

  async getActiveDepartmentForm(departmentId: string): Promise<TicketForm> {
    const response = await api.get(`/api/forms/departments/${departmentId}/active-form`);
    return response.data.data;
  }

  async getActiveDepartmentForms(departmentId: string): Promise<TicketForm[]> {
    const response = await api.get(`/api/forms/departments/${departmentId}/active-forms`);
    return response.data.data;
  }
}

export const formsService = new FormsService();
