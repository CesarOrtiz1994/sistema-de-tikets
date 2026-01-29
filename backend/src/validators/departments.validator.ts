import { z } from 'zod';

export const departmentValidators = {
  create: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    prefix: z.string().min(2, 'El prefijo debe tener al menos 2 caracteres').max(10, 'El prefijo no puede tener más de 10 caracteres'),
    description: z.string().optional(),
    isDefaultForRequesters: z.boolean().optional(),
    requireRating: z.boolean().optional(),
    autoCloseAfterDays: z.number().int().min(1, 'Debe ser al menos 1 día').max(90, 'No puede exceder 90 días').optional()
  }),

  update: z.object({
    name: z.string().min(2).optional(),
    prefix: z.string().min(2).max(10).optional(),
    description: z.string().optional(),
    isDefaultForRequesters: z.boolean().optional(),
    requireRating: z.boolean().optional(),
    autoCloseAfterDays: z.number().int().min(1, 'Debe ser al menos 1 día').max(90, 'No puede exceder 90 días').optional()
  }),

  assignUser: z.object({
    userId: z.string().uuid('ID de usuario inválido'),
    role: z.enum(['ADMIN', 'MEMBER'], { message: 'El rol debe ser ADMIN o MEMBER' })
  })
};
