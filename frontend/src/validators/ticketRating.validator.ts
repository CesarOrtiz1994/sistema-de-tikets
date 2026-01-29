import { z } from 'zod';

export const ticketRatingValidators = {
  closeWithRating: z.object({
    rating: z.number()
      .int('La calificación debe ser un número entero')
      .min(1, 'Debes seleccionar al menos 1 estrella')
      .max(5, 'La calificación máxima es 5 estrellas')
      .optional(),
    comment: z.string()
      .max(1000, 'El comentario no puede exceder 1000 caracteres')
      .optional()
  }),

  reopenTicket: z.object({
    reason: z.string()
      .min(10, 'La razón debe tener al menos 10 caracteres')
      .max(500, 'La razón no puede exceder 500 caracteres')
  })
};

export type CloseWithRatingData = z.infer<typeof ticketRatingValidators.closeWithRating>;
export type ReopenTicketData = z.infer<typeof ticketRatingValidators.reopenTicket>;
