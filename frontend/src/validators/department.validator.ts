import { z } from 'zod';

// Schema para información general del departamento
export const departmentInfoSchema = z.object({
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
  
  isDefaultForRequesters: z.boolean(),
  
  requireRating: z.boolean(),
  
  autoCloseAfterDays: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1 día')
    .max(90, 'No puede exceder 90 días')
});

// Schema para crear/editar SLA del departamento
export const createDepartmentSLASchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Prioridad inválida'
  }),
  
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  
  responseTime: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1 minuto')
    .max(10080, 'No puede exceder 7 días (10080 minutos)'),
  
  resolutionTime: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1 minuto')
    .max(43200, 'No puede exceder 30 días (43200 minutos)'),
  
  businessHoursOnly: z.boolean(),
  
  escalationEnabled: z.boolean(),
  
  escalationTime: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1 minuto')
    .max(10080, 'No puede exceder 7 días')
    .optional()
    .nullable(),
  
  notifyOnBreach: z.boolean(),
  
  notifyBefore: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1 minuto')
    .max(1440, 'No puede exceder 24 horas (1440 minutos)')
    .optional()
    .nullable(),
  
  isDefault: z.boolean().optional()
}).refine((data) => {
  // Si escalation está habilitado, escalationTime es requerido
  if (data.escalationEnabled && !data.escalationTime) {
    return false;
  }
  return true;
}, {
  message: 'El tiempo de escalamiento es requerido cuando el escalamiento está habilitado',
  path: ['escalationTime']
}).refine((data) => {
  // responseTime debe ser menor que resolutionTime
  return data.responseTime < data.resolutionTime;
}, {
  message: 'El tiempo de respuesta debe ser menor que el tiempo de resolución',
  path: ['resolutionTime']
});

// Tipos TypeScript inferidos desde los schemas
export type DepartmentInfoFormData = z.infer<typeof departmentInfoSchema>;
export type CreateDepartmentSLAFormData = z.infer<typeof createDepartmentSLASchema>;
