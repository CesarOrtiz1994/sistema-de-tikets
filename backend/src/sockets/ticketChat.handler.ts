import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from '../config/socket';
import { socketAuthMiddleware } from '../middlewares/socketAuth';
import { canAccessTicket, canSendMessage } from '../middlewares/socketPermissions';
import logger from '../config/logger';
import prisma from '../config/database';
import { unreadMessagesService } from '../services/unreadMessages.service';
import {
  messageRateLimiter,
  typingRateLimiter,
  joinLeaveRateLimiter
} from '../middlewares/socketRateLimit.middleware';
import { notifyNewMessage } from '../services/notificationTriggers.service';
import {
  joinTicketSchema,
  leaveTicketSchema,
  sendMessageSchema,
  typingSchema,
  JoinTicketData,
  LeaveTicketData,
  SendMessageData,
  TypingData
} from '../validators/socket.validator';

export const setupTicketChatHandlers = (io: SocketIOServer) => {
  // Aplicar middleware de autenticación
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;

    if (!userId) {
      logger.error('Socket connection without userId');
      socket.disconnect();
      return;
    }

    logger.info(`User connected: userId=${userId}, socketId=${socket.id}`);

    // Unir al usuario a su room personal para notificaciones directas
    socket.join(`user:${userId}`);

    /**
     * JOIN-TICKET: Usuario se une a un room de ticket
     */
    socket.on('join-ticket', async (data: JoinTicketData) => {
      try {
        // Rate limiting
        if (!joinLeaveRateLimiter.checkLimit(userId)) {
          const retryAfter = joinLeaveRateLimiter.getTimeUntilReset(userId);
          socket.emit('error', { 
            message: 'Estás realizando esta acción demasiado rápido. Por favor espera un momento.',
            retryAfter 
          });
          return;
        }

        // Validar datos con Zod
        const validationResult = joinTicketSchema.safeParse(data);
        if (!validationResult.success) {
          socket.emit('error', { 
            message: 'Datos inválidos',
            errors: validationResult.error.issues 
          });
          return;
        }

        const { ticketId } = validationResult.data;

        // Verificar permisos
        const hasAccess = await canAccessTicket(socket, ticketId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this ticket' });
          logger.warn(`User ${userId} denied access to ticket ${ticketId}`);
          
          // Auditoría de intento denegado
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'JOIN_TICKET_DENIED',
              resource: 'SOCKET_TICKET',
              resourceId: ticketId,
              details: { socketId: socket.id },
              status: 'ERROR',
              ipAddress: socket.handshake.address,
              userAgent: socket.handshake.headers['user-agent'] || 'unknown'
            }
          });
          return;
        }

        // Unirse al room del ticket
        socket.join(`ticket:${ticketId}`);
        
        logger.info(`User ${userId} joined ticket room: ${ticketId}`);
        
        // Auditoría de unión exitosa
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'JOIN_TICKET',
            resource: 'SOCKET_TICKET',
            resourceId: ticketId,
            details: { socketId: socket.id },
            status: 'SUCCESS',
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'] || 'unknown'
          }
        });
        
        // Notificar al usuario que se unió exitosamente
        socket.emit('joined-ticket', { ticketId });

        // Notificar a otros usuarios en el room que alguien se unió
        socket.to(`ticket:${ticketId}`).emit('user-joined', {
          userId,
          ticketId
        });
      } catch (error) {
        logger.error('Error in join-ticket:', error);
        socket.emit('error', { message: 'Failed to join ticket room' });
      }
    });

    /**
     * LEAVE-TICKET: Usuario sale de un room de ticket
     */
    socket.on('leave-ticket', async (data: LeaveTicketData) => {
      try {
        // Rate limiting
        if (!joinLeaveRateLimiter.checkLimit(userId)) {
          const retryAfter = joinLeaveRateLimiter.getTimeUntilReset(userId);
          socket.emit('error', { 
            message: 'Estás realizando esta acción demasiado rápido. Por favor espera un momento.',
            retryAfter 
          });
          return;
        }

        // Validar datos con Zod
        const validationResult = leaveTicketSchema.safeParse(data);
        if (!validationResult.success) {
          socket.emit('error', { 
            message: 'Datos inválidos',
            errors: validationResult.error.issues 
          });
          return;
        }

        const { ticketId } = validationResult.data;

        // Salir del room del ticket
        socket.leave(`ticket:${ticketId}`);
        
        logger.info(`User ${userId} left ticket room: ${ticketId}`);
        
        // Auditoría de salida
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'LEAVE_TICKET',
            resource: 'SOCKET_TICKET',
            resourceId: ticketId,
            details: { socketId: socket.id },
            status: 'SUCCESS',
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'] || 'unknown'
          }
        });
        
        // Notificar al usuario que salió exitosamente
        socket.emit('left-ticket', { ticketId });

        // Notificar a otros usuarios en el room que alguien salió
        socket.to(`ticket:${ticketId}`).emit('user-left', {
          userId,
          ticketId
        });
      } catch (error) {
        logger.error('Error in leave-ticket:', error);
        socket.emit('error', { message: 'Failed to leave ticket room' });
      }
    });

    /**
     * SEND-MESSAGE: Enviar mensaje en un ticket
     */
    socket.on('send-message', async (data: SendMessageData) => {
      try {
        logger.info('[send-message] Event received', { userId, data });
        
        // Rate limiting
        if (!messageRateLimiter.checkLimit(userId)) {
          const retryAfter = messageRateLimiter.getTimeUntilReset(userId);
          socket.emit('error', { 
            message: 'Estás enviando mensajes demasiado rápido. Por favor espera un momento.',
            retryAfter 
          });
          return;
        }

        // Validar datos con Zod
        const validationResult = sendMessageSchema.safeParse(data);
        if (!validationResult.success) {
          logger.error('[send-message] Validation failed', { 
            userId, 
            errors: validationResult.error.issues 
          });
          socket.emit('error', { 
            message: 'Datos inválidos',
            errors: validationResult.error.issues 
          });
          return;
        }

        const { ticketId, message, attachment, replyToId } = validationResult.data;
        logger.info('[send-message] Validation passed', { userId, ticketId, messageLength: message.length, hasAttachment: !!attachment, isReply: !!replyToId });

        // Verificar permisos
        const canSend = await canSendMessage(socket, ticketId);
        if (!canSend) {
          socket.emit('error', { message: 'You cannot send messages to this ticket' });
          logger.warn(`User ${userId} denied sending message to ticket ${ticketId}`);
          
          // Auditoría de intento denegado
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'SEND_MESSAGE_DENIED',
              resource: 'SOCKET_TICKET',
              resourceId: ticketId,
              details: { socketId: socket.id, messageLength: message.length },
              status: 'ERROR',
              ipAddress: socket.handshake.address,
              userAgent: socket.handshake.headers['user-agent'] || 'unknown'
            }
          });
          return;
        }

        // Validar que userId existe
        if (!userId) {
          socket.emit('error', { message: 'User ID is required' });
          return;
        }

        logger.info('[send-message] About to save message to database', { 
          ticketId, 
          userId, 
          messageLength: message.trim().length,
          hasReplyToId: !!replyToId 
        });

        // Guardar mensaje en la base de datos
        const savedMessage = await prisma.ticketMessage.create({
          data: {
            ticketId,
            userId: userId,
            message: message.trim(),
            attachmentUrl: attachment?.url || null,
            attachmentName: attachment?.name || null,
            attachmentType: attachment?.type || null,
            attachmentSize: attachment?.size || null,
            replyToId: replyToId || null
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true
              }
            },
            replyTo: {
              select: {
                id: true,
                message: true,
                userId: true,
                createdAt: true,
                attachmentUrl: true,
                attachmentName: true,
                attachmentType: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true
                  }
                }
              }
            }
          }
        });

        // Log para verificar si replyTo se obtuvo correctamente
        logger.info('[send-message] Saved message details:', {
          id: savedMessage.id,
          replyToId: savedMessage.replyToId,
          hasReplyTo: !!savedMessage.replyTo,
          replyToData: savedMessage.replyTo ? {
            id: savedMessage.replyTo.id,
            message: savedMessage.replyTo.message.substring(0, 50)
          } : null
        });

        // Preparar datos del mensaje para emitir
        const messageData = {
          id: savedMessage.id,
          ticketId: savedMessage.ticketId,
          userId: savedMessage.userId,
          message: savedMessage.message,
          attachmentUrl: savedMessage.attachmentUrl,
          attachmentName: savedMessage.attachmentName,
          attachmentType: savedMessage.attachmentType,
          attachmentSize: savedMessage.attachmentSize,
          replyToId: savedMessage.replyToId,
          replyTo: savedMessage.replyTo ? {
            id: savedMessage.replyTo.id,
            message: savedMessage.replyTo.message,
            userId: savedMessage.replyTo.userId,
            createdAt: savedMessage.replyTo.createdAt.toISOString(),
            attachmentUrl: savedMessage.replyTo.attachmentUrl,
            attachmentName: savedMessage.replyTo.attachmentName,
            attachmentType: savedMessage.replyTo.attachmentType,
            user: {
              id: savedMessage.replyTo.user.id,
              name: savedMessage.replyTo.user.name,
              email: savedMessage.replyTo.user.email,
              profilePicture: savedMessage.replyTo.user.profilePicture
            }
          } : null,
          createdAt: savedMessage.createdAt.toISOString(),
          user: {
            id: savedMessage.user!.id,
            name: savedMessage.user!.name,
            email: savedMessage.user!.email,
            profilePicture: savedMessage.user!.profilePicture
          }
        };

        logger.info(`[send-message] Message saved and sent in ticket ${ticketId} by user ${userId}`);

        // Marcar como leído para el usuario que envía el mensaje
        await unreadMessagesService.updateReadOnSend(userId, ticketId, savedMessage.id);

        // Emitir mensaje a todos en el room (incluyendo al emisor)
        io.to(`ticket:${ticketId}`).emit('new-message', messageData);

        // Emitir notificación de mensaje no leído a todos los usuarios involucrados
        // (requester y assignedTo) excepto al que envió el mensaje
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { requesterId: true, assignedToId: true, ticketNumber: true }
        });

        if (ticket) {
          const usersToNotify = [ticket.requesterId, ticket.assignedToId].filter(
            id => id && id !== userId
          );

          usersToNotify.forEach(notifyUserId => {
            io.to(`user:${notifyUserId}`).emit('unread-message-notification', {
              ticketId,
              messageId: savedMessage.id,
              senderId: userId,
              senderName: savedMessage.user!.name
            });
          });

          // Enviar push notification + notificación in-app para usuarios offline
          notifyNewMessage(
            { id: ticketId, ticketNumber: ticket.ticketNumber, requesterId: ticket.requesterId, assignedToId: ticket.assignedToId },
            userId,
            savedMessage.user!.name
          ).catch(err => logger.error('Error sending new message notification:', err));
        }

      } catch (error) {
        logger.error('[send-message] Error:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId,
          ticketId: data.ticketId
        });
        socket.emit('error', { 
          message: 'Failed to send message',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * TYPING: Usuario está escribiendo
     */
    socket.on('typing', async (data: TypingData) => {
      try {
        // Rate limiting
        if (!typingRateLimiter.checkLimit(userId)) {
          // No emitir error para typing, simplemente ignorar
          return;
        }

        // Validar datos con Zod
        const validationResult = typingSchema.safeParse(data);
        if (!validationResult.success) {
          // No emitir error para typing, solo ignorar
          return;
        }

        const { ticketId, isTyping } = validationResult.data;

        // Verificar permisos
        const hasAccess = await canAccessTicket(socket, ticketId);
        if (!hasAccess) {
          return;
        }

        // Obtener información del usuario
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        if (!user) {
          return;
        }

        // Emitir evento de typing a otros usuarios en el room (no al emisor)
        socket.to(`ticket:${ticketId}`).emit('user-typing', {
          userId,
          userName: user.name,
          isTyping
        });
      } catch (error) {
        logger.error('Error in typing:', error);
      }
    });

    /**
     * DISCONNECT: Usuario se desconecta
     */
    socket.on('disconnect', () => {
      logger.info(`User disconnected: userId=${userId}, socketId=${socket.id}`);
    });

    /**
     * ERROR: Manejo de errores del socket
     */
    socket.on('error', (error: Error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  logger.info('Ticket chat handlers initialized');
};
