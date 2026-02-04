import app from './app';
import { env } from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeSocket } from './config/socket';
import { setupTicketChatHandlers } from './sockets/ticketChat.handler';
import fileCleanupJob from './jobs/fileCleanup.job';
import slaCheckerWorker from './workers/slaChecker.worker';
import autoCloseTicketsWorker from './workers/autoCloseTickets.worker';

const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
      
      // Iniciar jobs de limpieza de archivos
      fileCleanupJob.start();
      
      // Iniciar worker de verificación SLA (cada 5 minutos)
      slaCheckerWorker.startScheduled(5);
      
      // Iniciar worker de auto-cierre de tickets (cada 1 hora)
      autoCloseTicketsWorker.startScheduled(1);
    });

    // Inicializar Socket.io
    const io = initializeSocket(server);
    setupTicketChatHandlers(io);
    logger.info('Socket.IO initialized and handlers configured');

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      server.close(() => {
        process.exit(1);
      });
    });

    // Manejo de señales de terminación
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      fileCleanupJob.stop();
      server.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server closed');
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      fileCleanupJob.stop();
      server.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server closed');
      });
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
