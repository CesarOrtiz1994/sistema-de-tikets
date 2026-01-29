import { z } from 'zod';

export const ticketRatingValidators = {
  // Validación para calificar un ticket
  rateTicket: z.object({
    rating: z.number()
      .int('La calificación debe ser un número entero')
      .min(1, 'La calificación mínima es 1 estrella')
      .max(5, 'La calificación máxima es 5 estrellas'),
    comment: z.string()
      .max(1000, 'El comentario no puede exceder 1000 caracteres')
      .optional()
  }),

  // Validación para cerrar ticket con calificación (rating es opcional si el departamento no lo requiere)
  closeWithRating: z.object({
    rating: z.number()
      .int('La calificación debe ser un número entero')
      .min(1, 'La calificación mínima es 1 estrella')
      .max(5, 'La calificación máxima es 5 estrellas')
      .optional(),
    comment: z.string()
      .max(1000, 'El comentario no puede exceder 1000 caracteres')
      .optional()
  }),

  // Validación para reabrir ticket
  reopenTicket: z.object({
    reason: z.string()
      .min(10, 'La razón debe tener al menos 10 caracteres')
      .max(500, 'La razón no puede exceder 500 caracteres')
  })
};
