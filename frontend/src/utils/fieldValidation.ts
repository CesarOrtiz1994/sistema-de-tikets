import { z } from 'zod';
import { ValidationType, FieldValidation } from '../types/fieldTypes';

// Función para crear esquema de validación dinámico basado en las reglas
export function createFieldSchema(validations: FieldValidation[] = []) {
  let schema: z.ZodTypeAny = z.any();

  validations.forEach((validation) => {
    switch (validation.type) {
      case ValidationType.REQUIRED:
        if (typeof schema === 'object' && 'optional' in schema) {
          schema = z.string().min(1, validation.message || 'Este campo es requerido');
        }
        break;

      case ValidationType.MIN_LENGTH:
        if (validation.value) {
          schema = z.string().min(
            validation.value,
            validation.message || `Mínimo ${validation.value} caracteres`
          );
        }
        break;

      case ValidationType.MAX_LENGTH:
        if (validation.value) {
          schema = z.string().max(
            validation.value,
            validation.message || `Máximo ${validation.value} caracteres`
          );
        }
        break;

      case ValidationType.MIN_VALUE:
        if (validation.value !== undefined) {
          schema = z.number().min(
            validation.value,
            validation.message || `Valor mínimo: ${validation.value}`
          );
        }
        break;

      case ValidationType.MAX_VALUE:
        if (validation.value !== undefined) {
          schema = z.number().max(
            validation.value,
            validation.message || `Valor máximo: ${validation.value}`
          );
        }
        break;

      case ValidationType.EMAIL:
        schema = z.string().email(validation.message || 'Email inválido');
        break;

      case ValidationType.URL:
        schema = z.string().url(validation.message || 'URL inválida');
        break;

      case ValidationType.PHONE:
        schema = z.string().regex(
          /^[\d\s\-\+\(\)]+$/,
          validation.message || 'Teléfono inválido'
        );
        break;

      case ValidationType.PATTERN:
        if (validation.value) {
          schema = z.string().regex(
            new RegExp(validation.value),
            validation.message || 'Formato inválido'
          );
        }
        break;

      case ValidationType.CUSTOM:
        // Para validaciones personalizadas
        if (validation.value && typeof validation.value === 'function') {
          schema = z.any().refine(validation.value, {
            message: validation.message || 'Validación personalizada falló'
          });
        }
        break;
    }
  });

  return schema;
}

// Función para validar un valor individual
export function validateField(value: any, validations: FieldValidation[] = []): string | null {
  try {
    const schema = createFieldSchema(validations);
    schema.parse(value);
    return null; // Sin errores
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Error de validación';
    }
    return 'Error de validación';
  }
}

// Función para validar múltiples campos
export function validateForm(
  values: Record<string, any>,
  fieldValidations: Record<string, FieldValidation[]>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(fieldValidations).forEach((fieldName) => {
    const value = values[fieldName];
    const validations = fieldValidations[fieldName];
    const error = validateField(value, validations);
    
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
}

// Esquemas predefinidos comunes
export const commonSchemas = {
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Teléfono inválido'),
  url: z.string().url('URL inválida'),
  required: z.string().min(1, 'Este campo es requerido'),
  optionalString: z.string().optional(),
  number: z.number(),
  positiveNumber: z.number().positive('Debe ser un número positivo'),
  date: z.date(),
  boolean: z.boolean(),
};

// Helper para crear validaciones desde el backend
export function createValidationsFromBackend(
  backendValidations: any[]
): FieldValidation[] {
  return backendValidations.map((v) => ({
    type: v.type as ValidationType,
    value: v.value,
    message: v.message || v.defaultErrorMessage
  }));
}
