import { useState, useCallback } from 'react';
import { z } from 'zod';
import { FormField } from '../services/forms.service';

interface ValidationErrors {
  [fieldId: string]: string;
}

interface FormValues {
  [fieldId: string]: any;
}

export function useFormValidation(fields: FormField[]) {
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Crear esquema de validación dinámico basado en los campos
  const createFieldSchema = useCallback((field: FormField): z.ZodTypeAny => {
    let schema: z.ZodTypeAny = z.any();

    // Determinar el tipo base según el tipo de campo
    const fieldTypeName = field.fieldType?.name?.toUpperCase();

    switch (fieldTypeName) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'SELECT':
      case 'RADIO':
        schema = z.string();
        break;
      case 'NUMBER':
      case 'CURRENCY':
      case 'RATING':
        schema = z.number();
        break;
      case 'EMAIL':
        schema = z.string().email('Email inválido');
        break;
      case 'URL':
        schema = z.string().url('URL inválida');
        break;
      case 'PHONE':
        schema = z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Teléfono inválido');
        break;
      case 'DATE':
      case 'DATETIME':
      case 'TIME':
        schema = z.string();
        break;
      case 'CHECKBOX':
      case 'MULTISELECT':
        schema = z.array(z.string());
        break;
      case 'TOGGLE':
        schema = z.boolean();
        break;
      case 'FILE':
      case 'MULTIFILE':
      case 'IMAGE':
        schema = z.any();
        break;
      default:
        schema = z.string();
    }

    // Aplicar validaciones adicionales desde validationRules
    if (field.validationRules) {
      const rules = field.validationRules;

      if (rules.minLength && schema instanceof z.ZodString) {
        schema = schema.min(rules.minLength, `Mínimo ${rules.minLength} caracteres`);
      }

      if (rules.maxLength && schema instanceof z.ZodString) {
        schema = schema.max(rules.maxLength, `Máximo ${rules.maxLength} caracteres`);
      }

      if (rules.minValue !== undefined && schema instanceof z.ZodNumber) {
        schema = schema.min(rules.minValue, `Valor mínimo: ${rules.minValue}`);
      }

      if (rules.maxValue !== undefined && schema instanceof z.ZodNumber) {
        schema = schema.max(rules.maxValue, `Valor máximo: ${rules.maxValue}`);
      }

      if (rules.pattern && schema instanceof z.ZodString) {
        schema = schema.regex(new RegExp(rules.pattern), rules.patternMessage || 'Formato inválido');
      }
    }

    // Aplicar required
    if (field.isRequired) {
      if (schema instanceof z.ZodString) {
        schema = schema.min(1, `${field.label} es requerido`);
      } else if (!(schema instanceof z.ZodBoolean)) {
        schema = schema.refine((val) => val !== null && val !== undefined && val !== '', {
          message: `${field.label} es requerido`
        });
      }
    } else {
      schema = schema.optional();
    }

    return schema;
  }, []);

  // Validar un campo individual
  const validateField = useCallback((field: FormField, value: any): string | null => {
    try {
      const schema = createFieldSchema(field);
      schema.parse(value);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || 'Error de validación';
      }
      return 'Error de validación';
    }
  }, [createFieldSchema]);

  // Validar todos los campos
  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    fields.forEach((field) => {
      if (!field.isVisible) return;

      const value = values[field.id];
      const error = validateField(field, value);

      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, values, validateField]);

  // Actualizar valor de un campo
  const setValue = useCallback((fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));

    // Validar en tiempo real si el campo ya fue tocado
    if (touched.has(fieldId)) {
      const field = fields.find((f) => f.id === fieldId);
      if (field) {
        const error = validateField(field, value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[fieldId] = error;
          } else {
            delete newErrors[fieldId];
          }
          return newErrors;
        });
      }
    }
  }, [fields, touched, validateField]);

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldId: string) => {
    setTouched((prev) => new Set(prev).add(fieldId));

    // Validar el campo cuando se marca como tocado
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      const value = values[fieldId];
      const error = validateField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[fieldId] = error;
        } else {
          delete newErrors[fieldId];
        }
        return newErrors;
      });
    }
  }, [fields, values, validateField]);

  // Resetear formulario
  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched(new Set());
  }, []);

  // Calcular progreso del formulario
  const getProgress = useCallback((): number => {
    const visibleFields = fields.filter((f) => f.isVisible);
    if (visibleFields.length === 0) return 0;

    const filledFields = visibleFields.filter((field) => {
      const value = values[field.id];
      return value !== undefined && value !== null && value !== '';
    });

    return Math.round((filledFields.length / visibleFields.length) * 100);
  }, [fields, values]);

  // Obtener campos requeridos faltantes
  const getMissingRequiredFields = useCallback((): FormField[] => {
    return fields.filter((field) => {
      if (!field.isVisible || !field.isRequired) return false;
      const value = values[field.id];
      return value === undefined || value === null || value === '';
    });
  }, [fields, values]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    getProgress,
    getMissingRequiredFields,
    isValid: Object.keys(errors).length === 0,
  };
}
