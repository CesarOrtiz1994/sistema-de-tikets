import { z } from 'zod';

// Enums
export const ticketStatusEnum = z.enum([
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING',
  'RESOLVED',
  'CLOSED',
  'CANCELLED'
]);

export const ticketPriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);

// Schema para crear ticket
export const createTicketSchema = z.object({
  departmentId: z.string().uuid('ID de departamento inválido'),
  formId: z.string().uuid('ID de formulario inválido'),
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  priority: ticketPriorityEnum.default('MEDIUM'),
  formData: z.record(z.string(), z.any()).refine(
    (data) => Object.keys(data).length > 0,
    'Los datos del formulario no pueden estar vacíos'
  )
});

// Schema para actualizar ticket
export const updateTicketSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .optional(),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToId: z.string().uuid('ID de usuario inválido').nullable().optional(),
  formData: z.record(z.string(), z.any()).optional()
});

// Schema para asignar ticket
export const assignTicketSchema = z.object({
  assignedUserIds: z.array(z.string().uuid('ID de usuario inválido')).min(1, 'Debe asignar al menos un usuario')
});

// Schema para cambiar estado
export const changeStatusSchema = z.object({
  status: ticketStatusEnum,
  comment: z.string().max(500, 'El comentario no puede exceder 500 caracteres').optional(),
  waitingReason: z.string().max(500, 'El motivo no puede exceder 500 caracteres').optional()
}).refine(
  (data) => data.status !== 'WAITING' || (data.waitingReason && data.waitingReason.trim().length > 0),
  { message: 'Debes indicar el motivo de espera', path: ['waitingReason'] }
);

// Schema para cambiar prioridad
export const changePrioritySchema = z.object({
  priority: ticketPriorityEnum,
  comment: z.string().max(500, 'El comentario no puede exceder 500 caracteres').optional()
});

// Schema para filtros de listado
export const listTicketsQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  requesterId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type ChangePriorityInput = z.infer<typeof changePrioritySchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
