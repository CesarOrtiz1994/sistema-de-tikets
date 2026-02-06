import { z } from 'zod';

/**
 * Validación para join-ticket event
 */
export const joinTicketSchema = z.object({
  ticketId: z.string().uuid('El ID del ticket debe ser un UUID válido')
});

/**
 * Validación para leave-ticket event
 */
export const leaveTicketSchema = z.object({
  ticketId: z.string().uuid('El ID del ticket debe ser un UUID válido')
});

/**
 * Validación para send-message event
 */
export const sendMessageSchema = z.object({
  ticketId: z.string().uuid('ID de ticket inválido'),
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(5000, 'El mensaje es demasiado largo'),
  attachment: z.object({
    url: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number()
  }).optional(),
  replyToId: z.string().uuid('ID de mensaje inválido').optional()
});

/**
 * Validación para typing event
 */
export const typingSchema = z.object({
  ticketId: z.string().uuid('El ID del ticket debe ser un UUID válido'),
  isTyping: z.boolean()
});

// Tipos inferidos de los schemas
export type JoinTicketData = z.infer<typeof joinTicketSchema>;
export type LeaveTicketData = z.infer<typeof leaveTicketSchema>;
export type SendMessageData = z.infer<typeof sendMessageSchema>;
export type TypingData = z.infer<typeof typingSchema>;
