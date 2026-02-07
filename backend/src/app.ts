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
import usersRoutes from './routes/users.routes';
import departmentsRoutes from './routes/departments.routes';
import departmentAccessRoutes from './routes/departmentAccess.routes';
import fieldTypeRoutes from './routes/fieldType.routes';
import slaConfigurationRoutes from './routes/slaConfiguration.routes';
import departmentSLARoutes from './routes/departmentSLA.routes';
import departmentWorkScheduleRoutes from './routes/departmentWorkSchedule.routes';
import ticketFormRoutes from './routes/ticketForm.routes';
import uploadRoutes from './routes/upload.routes';
import fileCleanupRoutes from './routes/fileCleanup.routes';
import ticketsRoutes from './routes/tickets.routes';
import kanbanRoutes from './routes/kanban.routes';
import ticketRatingRoutes from './routes/ticketRating.routes';
import ticketMessagesRoutes from './routes/ticketMessages.routes';
import chatAttachmentRoutes from './routes/chatAttachment.routes';
import unreadMessagesRoutes from './routes/unreadMessages.routes';
import ticketAttachmentsRoutes from './routes/ticketAttachments.routes';
import deliverablesRoutes from './routes/deliverables.routes';

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

// Rutas de usuarios
app.use('/api/users', usersRoutes);

// Rutas de departamentos (FASE 2)
app.use('/api/departments', departmentAccessRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/departments', departmentSLARoutes);
app.use('/api/departments', departmentWorkScheduleRoutes);

// Rutas de tipos de campo (FASE 2)
app.use('/api/field-types', fieldTypeRoutes);

// Rutas de configuraciones SLA (FASE 2)
app.use('/api/sla-configurations', slaConfigurationRoutes);

// Rutas de formularios de tickets (FASE 3 - SEMANA 7)
app.use('/api/forms', ticketFormRoutes);

// Rutas de upload de archivos (SEMANA 11)
app.use('/api/upload', uploadRoutes);

// Rutas de limpieza de archivos (SEMANA 11)
app.use('/api/file-cleanup', fileCleanupRoutes);

// Rutas de tickets (FASE 3 - SEMANA 12)
app.use('/api/tickets', ticketsRoutes);

// Rutas de calificación y cierre de tickets (SEMANA 23)
app.use('/api/tickets', ticketRatingRoutes);

// Rutas de Kanban (SEMANA 15)
app.use('/api', kanbanRoutes);

// Rutas de mensajes de tickets (SEMANA 17)
app.use('/api', ticketMessagesRoutes);

// Rutas de archivos adjuntos en chat (SEMANA 17)
app.use('/api', chatAttachmentRoutes);

// Rutas de mensajes no leídos (SEMANA 17)
app.use('/api/unread-messages', unreadMessagesRoutes);

// Rutas de archivos adjuntos de tickets (SEMANA 17)
app.use('/api/tickets', ticketAttachmentsRoutes);

// Rutas de entregables (deliverables)
app.use('/api/tickets', deliverablesRoutes);

// Servir archivos estáticos desde /uploads
app.use('/uploads', express.static('uploads'));

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
