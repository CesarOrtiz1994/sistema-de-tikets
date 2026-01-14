import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import passport from './config/passport';
import { env } from './config/env';
import { corsOptions } from './config/security';
import {
  helmetMiddleware,
  generalRateLimiter,
  bodySizeLimiter,
} from './middlewares/security.middleware';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
import logger, { stream } from './config/logger';
import authRoutes from './routes/auth.routes';
import permissionsRoutes from './routes/permissions.routes';
import auditRoutes from './routes/audit.routes';

const app: Application = express();

// Logging HTTP requests
app.use(morgan('combined', { stream }));

// Seguridad: Helmet para headers HTTP seguros
app.use(helmetMiddleware);

// Seguridad: CORS configurado
app.use(cors(corsOptions));

// Seguridad: Rate limiting general
app.use('/api/', generalRateLimiter);

// Seguridad: Límite de tamaño de body
app.use(bodySizeLimiter);

// Body parsers con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar Passport
app.use(passport.initialize());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de permisos
app.use('/api/permissions', permissionsRoutes);

// Rutas de auditoría
app.use('/api/audit', auditRoutes);

// Ruta de prueba
app.get('/api/health', (_req, res) => {
  logger.info('Health check endpoint called');
  res.json({
    status: 'ok',
    message: 'Tiket API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Middleware para rutas no encontradas (debe ir después de todas las rutas)
app.use(notFoundHandler);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

export default app;
