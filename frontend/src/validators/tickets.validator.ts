import { z } from 'zod';

export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTicketSchema = z.object({
  departmentId: z.string().uuid('ID de departamento inválido'),
  
  formId: z.string().uuid('ID de formulario inválido'),
  
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  
  priority: ticketPrioritySchema,
  
  formData: z.record(z.string(), z.any())
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debes completar al menos un campo del formulario'
    })
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
