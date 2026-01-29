import { Router } from 'express';
import ticketRatingController from '../controllers/ticketRating.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateZod';
import { ticketRatingValidators } from '../validators/ticketRating.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// PUT /api/tickets/:id/resolve - Marcar ticket como resuelto
router.put('/:id/resolve', ticketRatingController.resolveTicket);

// POST /api/tickets/:id/rate - Calificar ticket
router.post(
  '/:id/rate',
  validateBody(ticketRatingValidators.rateTicket),
  ticketRatingController.rateTicket
);

// PUT /api/tickets/:id/close - Cerrar ticket con calificación
router.put(
  '/:id/close',
  validateBody(ticketRatingValidators.closeWithRating),
  ticketRatingController.closeTicket
);

// POST /api/tickets/:id/reopen - Reabrir ticket
router.post(
  '/:id/reopen',
  validateBody(ticketRatingValidators.reopenTicket),
  ticketRatingController.reopenTicket
);

export default router;
