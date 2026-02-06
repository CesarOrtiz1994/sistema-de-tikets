import { z } from 'zod';

export const joinTicketSchema = z.object({
  ticketId: z.string().uuid('ID de ticket inválido')
});

export const leaveTicketSchema = z.object({
  ticketId: z.string().uuid('ID de ticket inválido')
});

export const sendMessageSchema = z.object({
  ticketId: z.string().uuid('ID de ticket inválido'),
  message: z.string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(5000, 'El mensaje es demasiado largo (máximo 5000 caracteres)')
    .trim(),
  replyToId: z.string().uuid('ID de mensaje inválido').optional()
});

export const typingSchema = z.object({
  ticketId: z.string().uuid('ID de ticket inválido'),
  isTyping: z.boolean()
});

export const messageReceivedSchema = z.object({
  id: z.string().min(1), // Acepta UUID o IDs temporales como "temp-123456789"
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string(),
  attachmentUrl: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
  attachmentType: z.string().nullable().optional(),
  attachmentSize: z.number().nullable().optional(),
  replyToId: z.string().uuid().nullable().optional(),
  replyTo: z.object({
    id: z.string().uuid(),
    message: z.string(),
    userId: z.string().uuid(),
    createdAt: z.string().datetime(),
    attachmentUrl: z.string().nullable().optional(),
    attachmentName: z.string().nullable().optional(),
    attachmentType: z.string().nullable().optional(),
    user: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      profilePicture: z.string().nullable().optional()
    })
  }).nullable().optional(),
  createdAt: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    profilePicture: z.string().nullable().optional()
  })
});

export const typingEventSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string(),
  isTyping: z.boolean()
});

export const errorEventSchema = z.object({
  message: z.string(),
  code: z.string().optional()
});

export type JoinTicketData = z.infer<typeof joinTicketSchema>;
export type LeaveTicketData = z.infer<typeof leaveTicketSchema>;
export type SendMessageData = z.infer<typeof sendMessageSchema>;
export type TypingData = z.infer<typeof typingSchema>;
export type MessageReceived = z.infer<typeof messageReceivedSchema>;
export type TypingEvent = z.infer<typeof typingEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
