import { z } from 'zod';

// ============================================
// TICKET FORM SCHEMAS
// ============================================

export const createFormSchema = z.object({
  departmentId: z.string().uuid('El ID del departamento debe ser un UUID válido'),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  isDefault: z.boolean().optional()
});

export const updateFormSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  isDefault: z.boolean().optional()
});

// ============================================
// FORM FIELD SCHEMAS
// ============================================

export const addFieldSchema = z.object({
  formId: z.string().uuid('El ID del formulario debe ser un UUID válido'),
  fieldTypeId: z.string().uuid('El ID del tipo de campo debe ser un UUID válido'),
  label: z.string()
    .min(1, 'La etiqueta es requerida')
    .max(200, 'La etiqueta no puede exceder 200 caracteres'),
  placeholder: z.string()
    .max(200, 'El placeholder no puede exceder 200 caracteres')
    .optional(),
  helpText: z.string()
    .max(500, 'El texto de ayuda no puede exceder 500 caracteres')
    .optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0, 'El orden debe ser un número entero positivo').optional(),
  defaultValue: z.string().optional(),
  validationRules: z.any().optional()
});

export const updateFieldSchema = z.object({
  label: z.string()
    .min(1, 'La etiqueta es requerida')
    .max(200, 'La etiqueta no puede exceder 200 caracteres')
    .optional(),
  placeholder: z.string()
    .max(200, 'El placeholder no puede exceder 200 caracteres')
    .optional(),
  helpText: z.string()
    .max(500, 'El texto de ayuda no puede exceder 500 caracteres')
    .optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  defaultValue: z.string().optional(),
  validationRules: z.any().optional()
});

// ============================================
// FIELD OPTION SCHEMAS
// ============================================

export const addFieldOptionSchema = z.object({
  fieldId: z.string().uuid('El ID del campo debe ser un UUID válido'),
  label: z.string()
    .min(1, 'La etiqueta es requerida')
    .max(200, 'La etiqueta no puede exceder 200 caracteres'),
  value: z.string()
    .min(1, 'El valor es requerido')
    .max(200, 'El valor no puede exceder 200 caracteres'),
  order: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional()
});

export const updateFieldOptionSchema = z.object({
  label: z.string()
    .min(1, 'La etiqueta es requerida')
    .max(200, 'La etiqueta no puede exceder 200 caracteres')
    .optional(),
  value: z.string()
    .min(1, 'El valor es requerido')
    .max(200, 'El valor no puede exceder 200 caracteres')
    .optional(),
  order: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional()
});

// ============================================
// UTILITY SCHEMAS
// ============================================

export const reorderFieldsSchema = z.object({
  fieldOrders: z.array(z.object({
    id: z.string().uuid('Cada ID debe ser un UUID válido'),
    order: z.number().int().min(0, 'Cada orden debe ser un número entero positivo')
  }))
});

export const duplicateFormSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
});

export const bulkCreateOptionsSchema = z.object({
  options: z.array(z.object({
    label: z.string().min(1, 'Cada opción debe tener una etiqueta'),
    value: z.string().min(1, 'Cada opción debe tener un valor'),
    order: z.number().int().min(0).optional(),
    isDefault: z.boolean().optional()
  }))
});
