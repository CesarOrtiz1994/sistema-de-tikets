import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';
import prisma from '../config/database';
import { AuthenticatedSocket } from '../config/socket';

interface JWTPayload {
  userId: string;
  email: string;
  roleType: string;
}

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Socket connection attempt without token');
      return next(new Error('Authentication token required'));
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Validar que el token contenga el ID del usuario
    if (!decoded.userId) {
      logger.warn('Socket connection attempt with invalid token payload (missing userId)');
      return next(new Error('Invalid token payload'));
    }

    // Obtener información del usuario desde la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        departmentUsers: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      logger.warn(`Socket connection attempt with invalid user: ${decoded.userId}`);
      return next(new Error('User not found or inactive'));
    }

    // Agregar información del usuario al socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId = user.id;
    authSocket.userRole = user.roleType;
    authSocket.departmentIds = user.departmentUsers.map(du => du.departmentId);

    logger.info(`Socket authenticated: userId=${user.id}, role=${user.roleType}`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    return next(new Error('Authentication failed'));
  }
};
