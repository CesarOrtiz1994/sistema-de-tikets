import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import rateLimit from 'express-rate-limit';
import botController from '../controllers/bot.controller';

const router = Router();

// Rate limiter específico para el bot (más restrictivo que otros endpoints)
const botLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // 10 preguntas por minuto
  message: 'Demasiadas preguntas al bot, por favor espera un momento',
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/bot - Enviar pregunta al chatbot
router.post(
  '/',
  authenticate,
  botLimiter,
  botController.askQuestion
);

export default router;
