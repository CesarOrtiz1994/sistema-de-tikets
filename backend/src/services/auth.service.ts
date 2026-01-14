import prisma from '../config/database';
import { generateTokenPair, verifyRefreshToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export class AuthService {
  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.userSession.deleteMany({
      where: {
        userId,
        isActive: false,
      },
    });

    const session = await prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
        isActive: true,
      },
    });

    return session;
  }

  async generateTokensForUser(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        roleType: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError('User not found or inactive', 404);
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleType: user.roleType,
    };

    const tokens = generateTokenPair(payload);

    await this.createSession(userId, tokens.refreshToken, ipAddress, userAgent);

    logger.info(`Tokens generated for user: ${user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        roleType: user.roleType,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      verifyRefreshToken(refreshToken);

      const session = await prisma.userSession.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || !session.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (new Date() > session.expiresAt) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: { isActive: false },
        });
        throw new AppError('Refresh token expired', 401);
      }

      if (!session.user.isActive || session.user.deletedAt) {
        throw new AppError('User account is inactive', 401);
      }

      const newPayload: JwtPayload = {
        userId: session.user.id,
        email: session.user.email,
        roleType: session.user.roleType,
      };

      const tokens = generateTokenPair(newPayload);

      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          updatedAt: new Date(),
        },
      });

      logger.info(`Access token refreshed for user: ${session.user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(refreshToken: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
    });

    if (session) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false },
      });

      logger.info(`User logged out, session deactivated`);
    }
  }

  async logoutAllSessions(userId: string) {
    await prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    logger.info(`All sessions logged out for user: ${userId}`);
  }

  async getActiveSessions(userId: string) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions;
  }

  async cleanExpiredSessions() {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false, updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    logger.info(`Cleaned ${result.count} expired sessions`);
    return result.count;
  }
}

export default new AuthService();
