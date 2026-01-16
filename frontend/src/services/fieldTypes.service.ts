import api from './api';

export interface FieldType {
  id: string;
  name: string;
  code: string;
  category: string;
  icon?: string;
  description?: string;
  isActive: boolean;
}

class FieldTypesService {
  async getFieldTypes(): Promise<FieldType[]> {
    const response = await api.get('/field-types');
    return response.data.data;
  }

  async getFieldTypeById(id: string): Promise<FieldType> {
    const response = await api.get(`/field-types/${id}`);
    return response.data.data;
  }
}

export const fieldTypesService = new FieldTypesService();
