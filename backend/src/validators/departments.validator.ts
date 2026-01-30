import { z } from 'zod';

export const departmentValidators = {
  create: z.object({
    name: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    prefix: z.string()
      .min(2, 'El prefijo debe tener al menos 2 caracteres')
      .max(10, 'El prefijo no puede exceder 10 caracteres')
      .regex(/^[A-Z0-9]+$/, 'El prefijo debe contener solo letras mayúsculas y números'),
    description: z.string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .optional(),
    isDefaultForRequesters: z.boolean().optional(),
    requireRating: z.boolean().optional(),
    autoCloseAfterDays: z.number()
      .int('Debe ser un número entero')
      .min(1, 'Debe ser al menos 1 día')
      .max(90, 'No puede exceder 90 días')
      .optional()
  }),

  update: z.object({
    name: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .optional(),
    prefix: z.string()
      .min(2, 'El prefijo debe tener al menos 2 caracteres')
      .max(10, 'El prefijo no puede exceder 10 caracteres')
      .regex(/^[A-Z0-9]+$/, 'El prefijo debe contener solo letras mayúsculas y números')
      .optional(),
    description: z.string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .optional(),
    isDefaultForRequesters: z.boolean().optional(),
    requireRating: z.boolean().optional(),
    autoCloseAfterDays: z.number()
      .int('Debe ser un número entero')
      .min(1, 'Debe ser al menos 1 día')
      .max(90, 'No puede exceder 90 días')
      .optional()
  }),

  assignUser: z.object({
    userId: z.string().uuid('ID de usuario inválido'),
    role: z.enum(['ADMIN', 'MEMBER'], { message: 'El rol debe ser ADMIN o MEMBER' })
  })
};
