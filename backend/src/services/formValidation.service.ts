import { z } from 'zod';
import prisma from '../config/database';
import logger from '../config/logger';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

interface FieldValidationRules {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  minDate?: string;
  maxDate?: string;
  step?: number;
  allowMultiple?: boolean;
}

export class FormValidationService {
  /**
   * Valida que los datos del formulario cumplan con el schema del formulario
   */
  async validateFormData(
    formId: string,
    formData: Record<string, any>
  ): Promise<ValidationResult> {
    const errors: Record<string, string[]> = {};

    try {
      // Obtener el formulario con sus campos
      const form = await prisma.ticketForm.findUnique({
        where: { id: formId },
        include: {
          fields: {
            where: { isVisible: true },
            include: {
              fieldType: true,
              options: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      });

      if (!form) {
        throw new Error('Formulario no encontrado');
      }

      // Validar cada campo
      for (const field of form.fields) {
        const fieldErrors: string[] = [];
        const fieldValue = formData[field.id];
        const fieldTypeName = field.fieldType.name.toUpperCase();
        const validationRules = field.validationRules as FieldValidationRules | null;

        // Validar campo requerido
        if (field.isRequired) {
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            fieldErrors.push(`El campo "${field.label}" es obligatorio`);
            errors[field.id] = fieldErrors;
            continue;
          }
        }

        // Si el campo no es requerido y está vacío, no validar más
        if (!fieldValue && fieldValue !== 0 && fieldValue !== false) {
          continue;
        }

        // Validaciones por tipo de campo
        switch (fieldTypeName) {
          case 'TEXT':
          case 'TEXTAREA':
          case 'EMAIL':
          case 'PHONE':
          case 'URL':
            this.validateTextField(fieldValue, field.label, validationRules, fieldErrors);
            break;

          case 'NUMBER':
          case 'CURRENCY':
            this.validateNumberField(fieldValue, field.label, validationRules, fieldErrors);
            break;

          case 'EMAIL':
            this.validateEmailField(fieldValue, field.label, fieldErrors);
            break;

          case 'PHONE':
            this.validatePhoneField(fieldValue, field.label, fieldErrors);
            break;

          case 'URL':
            this.validateUrlField(fieldValue, field.label, fieldErrors);
            break;

          case 'SELECT':
          case 'RADIO':
            this.validateSelectField(fieldValue, field.label, field.options, fieldErrors);
            break;

          case 'MULTISELECT':
          case 'CHECKBOX':
            this.validateMultiSelectField(fieldValue, field.label, field.options, fieldErrors);
            break;

          case 'TOGGLE':
            this.validateToggleField(fieldValue, field.label, fieldErrors);
            break;

          case 'DATE':
          case 'TIME':
          case 'DATETIME':
            this.validateDateField(fieldValue, field.label, validationRules, fieldErrors);
            break;

          case 'FILE':
          case 'IMAGE':
          case 'MULTIFILE':
            this.validateFileField(fieldValue, field.label, fieldTypeName, validationRules, fieldErrors);
            break;

          case 'RATING':
            this.validateRatingField(fieldValue, field.label, fieldErrors);
            break;

          case 'COLOR':
            this.validateColorField(fieldValue, field.label, fieldErrors);
            break;
        }

        if (fieldErrors.length > 0) {
          errors[field.id] = fieldErrors;
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    } catch (error) {
      logger.error('Error validando form_data:', error);
      throw error;
    }
  }

  private validateTextField(
    value: any,
    label: string,
    rules: FieldValidationRules | null,
    errors: string[]
  ): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser texto`);
      return;
    }

    if (rules?.minLength && value.length < rules.minLength) {
      errors.push(`El campo "${label}" debe tener al menos ${rules.minLength} caracteres`);
    }

    if (rules?.maxLength && value.length > rules.maxLength) {
      errors.push(`El campo "${label}" no puede exceder ${rules.maxLength} caracteres`);
    }

    if (rules?.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          errors.push(`El campo "${label}" no cumple con el formato requerido`);
        }
      } catch (e) {
        logger.warn(`Patrón regex inválido para campo ${label}: ${rules.pattern}`);
      }
    }
  }

  private validateNumberField(
    value: any,
    label: string,
    rules: FieldValidationRules | null,
    errors: string[]
  ): void {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      errors.push(`El campo "${label}" debe ser un número válido`);
      return;
    }

    if (rules?.minValue !== undefined && numValue < rules.minValue) {
      errors.push(`El campo "${label}" debe ser mayor o igual a ${rules.minValue}`);
    }

    if (rules?.maxValue !== undefined && numValue > rules.maxValue) {
      errors.push(`El campo "${label}" debe ser menor o igual a ${rules.maxValue}`);
    }
  }

  private validateEmailField(value: any, label: string, errors: string[]): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser texto`);
      return;
    }

    const emailSchema = z.string().email();
    const result = emailSchema.safeParse(value);
    if (!result.success) {
      errors.push(`El campo "${label}" debe ser un email válido`);
    }
  }

  private validatePhoneField(value: any, label: string, errors: string[]): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser texto`);
      return;
    }

    // Validación básica de teléfono (10-15 dígitos)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    if (!phoneRegex.test(value)) {
      errors.push(`El campo "${label}" debe ser un número de teléfono válido`);
    }
  }

  private validateUrlField(value: any, label: string, errors: string[]): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser texto`);
      return;
    }

    const urlSchema = z.string().url();
    const result = urlSchema.safeParse(value);
    if (!result.success) {
      errors.push(`El campo "${label}" debe ser una URL válida`);
    }
  }

  private validateSelectField(
    value: any,
    label: string,
    options: any[],
    errors: string[]
  ): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser una opción válida`);
      return;
    }

    const validValues = options.map(opt => opt.value);
    if (!validValues.includes(value)) {
      errors.push(`El campo "${label}" contiene una opción no válida`);
    }
  }

  private validateMultiSelectField(
    value: any,
    label: string,
    options: any[],
    errors: string[]
  ): void {
    if (!Array.isArray(value)) {
      errors.push(`El campo "${label}" debe ser un array de opciones`);
      return;
    }

    const validValues = options.map(opt => opt.value);
    for (const val of value) {
      if (!validValues.includes(val)) {
        errors.push(`El campo "${label}" contiene opciones no válidas`);
        break;
      }
    }
  }

  private validateToggleField(value: any, label: string, errors: string[]): void {
    if (typeof value !== 'boolean') {
      errors.push(`El campo "${label}" debe ser verdadero o falso`);
    }
  }

  private validateDateField(
    value: any,
    label: string,
    rules: FieldValidationRules | null,
    errors: string[]
  ): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser una fecha válida`);
      return;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push(`El campo "${label}" debe ser una fecha válida`);
      return;
    }

    if (rules?.minDate) {
      const minDate = new Date(rules.minDate);
      if (date < minDate) {
        errors.push(`El campo "${label}" debe ser posterior a ${minDate.toLocaleDateString()}`);
      }
    }

    if (rules?.maxDate) {
      const maxDate = new Date(rules.maxDate);
      if (date > maxDate) {
        errors.push(`El campo "${label}" debe ser anterior a ${maxDate.toLocaleDateString()}`);
      }
    }
  }

  private validateFileField(
    value: any,
    label: string,
    fieldType: string,
    rules: FieldValidationRules | null,
    errors: string[]
  ): void {
    // El valor debe ser un array de objetos con información de archivos
    if (!Array.isArray(value)) {
      errors.push(`El campo "${label}" debe contener archivos válidos`);
      return;
    }

    if (value.length === 0) {
      return; // Ya se validó si es requerido
    }

    // Validar cada archivo
    for (const file of value) {
      if (!file.filename || !file.mimetype || !file.size) {
        errors.push(`El campo "${label}" contiene archivos con información incompleta`);
        continue;
      }

      // Validar tamaño
      if (rules?.maxFileSize && file.size > rules.maxFileSize) {
        const maxSizeMB = (rules.maxFileSize / (1024 * 1024)).toFixed(1);
        errors.push(`El archivo "${file.originalName || file.filename}" excede el tamaño máximo de ${maxSizeMB} MB`);
      }

      // Validar tipo de archivo según fieldType
      const mimeType = file.mimetype.toLowerCase();
      const isImage = mimeType.startsWith('image/');

      if (fieldType === 'IMAGE' && !isImage) {
        errors.push(`El campo "${label}" solo acepta imágenes`);
      } else if (fieldType === 'FILE' && isImage) {
        errors.push(`El campo "${label}" solo acepta documentos, no imágenes`);
      }

      // Validar tipos aceptados específicos
      if (rules?.acceptedFileTypes && rules.acceptedFileTypes !== '*/*') {
        const acceptedTypes = rules.acceptedFileTypes.split(',').map(t => t.trim());
        const fileExtension = file.filename.substring(file.filename.lastIndexOf('.')).toLowerCase();
        
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          return mimeType === type.toLowerCase();
        });

        if (!isAccepted) {
          errors.push(`El archivo "${file.originalName || file.filename}" no es un tipo permitido. Solo se aceptan: ${rules.acceptedFileTypes}`);
        }
      }
    }
  }

  private validateRatingField(value: any, label: string, errors: string[]): void {
    const numValue = typeof value === 'string' ? parseInt(value) : value;

    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      errors.push(`El campo "${label}" debe ser una calificación entre 1 y 5`);
    }
  }

  private validateColorField(value: any, label: string, errors: string[]): void {
    if (typeof value !== 'string') {
      errors.push(`El campo "${label}" debe ser un color válido`);
      return;
    }

    // Validar formato hexadecimal (#RRGGBB)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(value)) {
      errors.push(`El campo "${label}" debe ser un color en formato hexadecimal (#RRGGBB)`);
    }
  }

  /**
   * Valida que todos los archivos referenciados en form_data existan
   */
  async validateFileReferences(formData: Record<string, any>): Promise<string[]> {
    const errors: string[] = [];
    
    // Buscar todos los campos que contengan archivos
    for (const value of Object.values(formData)) {
      if (Array.isArray(value) && value.length > 0) {
        // Verificar si son objetos de archivo
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object' && 'filename' in firstItem) {
          // Validar que los archivos existan en el sistema
          for (const file of value) {
            if (!file.path) {
              errors.push(`El archivo "${file.originalName || file.filename}" no tiene una ruta válida`);
            }
            // Aquí podrías agregar validación adicional para verificar que el archivo existe en disco
          }
        }
      }
    }

    return errors;
  }
}

export const formValidationService = new FormValidationService();
