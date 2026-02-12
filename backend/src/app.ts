import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import passport from './config/passport';
import { env } from './config/env';
import { corsOptions } from './config/security';
import { swaggerSpec } from './config/swagger';
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
import notificationsRoutes from './routes/notifications.routes';
import emailTemplateRoutes from './routes/emailTemplate.routes';
import metricsRoutes from './routes/metrics.routes';

const app: Application = express();

// Trust proxy (Nginx reverse proxy en la misma máquina)
app.set('trust proxy', 1);

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

// Rutas de departamentos
app.use('/api/departments', departmentAccessRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/departments', departmentSLARoutes);
app.use('/api/departments', departmentWorkScheduleRoutes);

// Rutas de tipos de campo
app.use('/api/field-types', fieldTypeRoutes);

// Rutas de configuraciones SLA
app.use('/api/sla-configurations', slaConfigurationRoutes);

// Rutas de formularios
app.use('/api/forms', ticketFormRoutes);

// Rutas de subida de archivos
app.use('/api/upload', uploadRoutes);

// Rutas de limpieza de archivos
app.use('/api/file-cleanup', fileCleanupRoutes);

// Rutas de tickets
app.use('/api/tickets', ticketsRoutes);
app.use('/api/tickets', ticketRatingRoutes);

// Rutas de kanban
app.use('/api', kanbanRoutes);

// Rutas de mensajes de tickets
app.use('/api', ticketMessagesRoutes);

// Rutas de adjuntos de chat
app.use('/api', chatAttachmentRoutes);

// Rutas de mensajes no leídos
app.use('/api/unread-messages', unreadMessagesRoutes);

// Rutas de adjuntos de tickets
app.use('/api/tickets', ticketAttachmentsRoutes);
app.use('/api/tickets', deliverablesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

// Rutas de métricas (SEMANA 22)
app.use('/api/metrics', metricsRoutes);
app.use('/uploads', express.static('uploads'));

// Documentación API con Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sistema de Tickets - API Docs',
}));

// Exportar OpenAPI spec en JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
