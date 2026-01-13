import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import logger from './logger';
import { env } from './env';

// Crear pool de conexiones de PostgreSQL
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Crear adaptador de Prisma
const adapter = new PrismaPg(pool);

// Crear cliente de Prisma con el adaptador
const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log de queries en desarrollo
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log de errores
prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

// Log de warnings
prisma.$on('warn', (e: any) => {
  logger.warn('Prisma Warning:', e);
});

// Función para conectar a la base de datos
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

export default prisma;
