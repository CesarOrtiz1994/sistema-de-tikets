import prisma from '../config/database';
import { FieldCategory } from '@prisma/client';

export class FieldTypeService {
  async getAllFieldTypes() {
    return await prisma.fieldType.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async getFieldTypesByCategory(category: FieldCategory) {
    return await prisma.fieldType.findMany({
      where: { 
        category,
        isActive: true 
      },
      orderBy: { name: 'asc' }
    });
  }

  async getFieldTypeById(id: string) {
    return await prisma.fieldType.findUnique({
      where: { id }
    });
  }

  async getFieldTypeByName(name: string) {
    return await prisma.fieldType.findUnique({
      where: { name }
    });
  }

  async getFieldTypeValidations(id: string) {
    const fieldType = await prisma.fieldType.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true
      }
    });

    if (!fieldType) {
      throw new Error('Field type not found');
    }

    const allValidations = await prisma.validationRuleCatalog.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    const compatibleValidations = allValidations.filter(validation => {
      if (validation.type === 'REQUIRED') return true;

      if (['TEXT', 'ADVANCED'].includes(fieldType.category)) {
        return ['MIN_LENGTH', 'MAX_LENGTH', 'PATTERN', 'EMAIL', 'URL', 'PHONE'].includes(validation.type);
      }

      if (fieldType.category === 'NUMBER') {
        return ['MIN_VALUE', 'MAX_VALUE', 'PATTERN'].includes(validation.type);
      }

      if (fieldType.category === 'SELECTION') {
        return ['MIN_LENGTH', 'MAX_LENGTH'].includes(validation.type);
      }

      if (fieldType.category === 'DATE') {
        return ['MIN_VALUE', 'MAX_VALUE'].includes(validation.type);
      }

      if (fieldType.category === 'FILE') {
        return ['MAX_LENGTH'].includes(validation.type);
      }

      return false;
    });

    return {
      fieldType,
      validations: compatibleValidations
    };
  }

  async createFieldType(data: {
    name: string;
    label: string;
    category: FieldCategory;
    description?: string;
    icon?: string;
    hasOptions?: boolean;
    allowMultiple?: boolean;
    hasPlaceholder?: boolean;
    hasDefaultValue?: boolean;
    availableValidations?: any;
    componentType: string;
    inputProps?: any;
  }) {
    return await prisma.fieldType.create({
      data
    });
  }

  async updateFieldType(id: string, data: {
    label?: string;
    description?: string;
    icon?: string;
    hasOptions?: boolean;
    allowMultiple?: boolean;
    hasPlaceholder?: boolean;
    hasDefaultValue?: boolean;
    availableValidations?: any;
    componentType?: string;
    inputProps?: any;
    isActive?: boolean;
  }) {
    return await prisma.fieldType.update({
      where: { id },
      data
    });
  }

  async deleteFieldType(id: string) {
    return await prisma.fieldType.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getFieldTypeStats() {
    const total = await prisma.fieldType.count({
      where: { isActive: true }
    });

    const byCategory = await prisma.fieldType.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true
    });

    return {
      total,
      byCategory: byCategory.map(item => ({
        category: item.category,
        count: item._count
      }))
    };
  }
}

export default new FieldTypeService();
