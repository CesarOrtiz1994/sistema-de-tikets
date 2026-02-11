import { getRedisClient } from '../config/redis';
import logger from '../config/logger';

// TTL en segundos
const TTL = {
  METRICS: 5 * 60,         // 5 minutos
  FORMS: 10 * 60,          // 10 minutos
  FIELD_TYPES: 30 * 60,    // 30 minutos
  SLA_CONFIG: 30 * 60,     // 30 minutos
  DEPARTMENTS: 15 * 60,    // 15 minutos
  DEFAULT: 5 * 60,         // 5 minutos
};

// Prefijos de cache
const PREFIX = {
  METRICS: 'metrics:',
  FORMS: 'forms:',
  FIELD_TYPES: 'field_types:',
  SLA_CONFIG: 'sla_config:',
  DEPARTMENTS: 'departments:',
};

class CacheService {
  /**
   * Obtener valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      if (!redis) return null;

      const data = await redis.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (err: any) {
      logger.warn(`Cache GET error [${key}]:`, err.message);
      return null;
    }
  }

  /**
   * Guardar valor en cache con TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.setex(key, TTL.DEFAULT, serialized);
      }
    } catch (err: any) {
      logger.warn(`Cache SET error [${key}]:`, err.message);
    }
  }

  /**
   * Eliminar una clave específica
   */
  async del(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      await redis.del(key);
    } catch (err: any) {
      logger.warn(`Cache DEL error [${key}]:`, err.message);
    }
  }

  /**
   * Invalidar todas las claves que coincidan con un patrón
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cache invalidated ${keys.length} keys matching: ${pattern}`);
      }
    } catch (err: any) {
      logger.warn(`Cache invalidatePattern error [${pattern}]:`, err.message);
    }
  }

  // ==================== MÉTRICAS ====================

  async getMetrics(key: string): Promise<any | null> {
    return this.get(`${PREFIX.METRICS}${key}`);
  }

  async setMetrics(key: string, data: any): Promise<void> {
    await this.set(`${PREFIX.METRICS}${key}`, data, TTL.METRICS);
  }

  async invalidateMetrics(): Promise<void> {
    await this.invalidatePattern(`${PREFIX.METRICS}*`);
  }

  // ==================== FORMULARIOS ====================

  async getForm(key: string): Promise<any | null> {
    return this.get(`${PREFIX.FORMS}${key}`);
  }

  async setForm(key: string, data: any): Promise<void> {
    await this.set(`${PREFIX.FORMS}${key}`, data, TTL.FORMS);
  }

  async invalidateForms(departmentId?: string): Promise<void> {
    if (departmentId) {
      await this.invalidatePattern(`${PREFIX.FORMS}*${departmentId}*`);
    } else {
      await this.invalidatePattern(`${PREFIX.FORMS}*`);
    }
  }

  // ==================== TIPOS DE CAMPOS ====================

  async getFieldTypes(key: string): Promise<any | null> {
    return this.get(`${PREFIX.FIELD_TYPES}${key}`);
  }

  async setFieldTypes(key: string, data: any): Promise<void> {
    await this.set(`${PREFIX.FIELD_TYPES}${key}`, data, TTL.FIELD_TYPES);
  }

  async invalidateFieldTypes(): Promise<void> {
    await this.invalidatePattern(`${PREFIX.FIELD_TYPES}*`);
  }

  // ==================== CONFIGURACIONES SLA ====================

  async getSLAConfig(key: string): Promise<any | null> {
    return this.get(`${PREFIX.SLA_CONFIG}${key}`);
  }

  async setSLAConfig(key: string, data: any): Promise<void> {
    await this.set(`${PREFIX.SLA_CONFIG}${key}`, data, TTL.SLA_CONFIG);
  }

  async invalidateSLAConfig(): Promise<void> {
    await this.invalidatePattern(`${PREFIX.SLA_CONFIG}*`);
  }

  // ==================== DEPARTAMENTOS ====================

  async getDepartments(key: string): Promise<any | null> {
    return this.get(`${PREFIX.DEPARTMENTS}${key}`);
  }

  async setDepartments(key: string, data: any): Promise<void> {
    await this.set(`${PREFIX.DEPARTMENTS}${key}`, data, TTL.DEPARTMENTS);
  }

  async invalidateDepartments(): Promise<void> {
    await this.invalidatePattern(`${PREFIX.DEPARTMENTS}*`);
  }

  // ==================== UTILIDADES ====================

  /**
   * Flush all cache
   */
  async flushAll(): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      await redis.flushdb();
      logger.info('Cache flushed');
    } catch (err: any) {
      logger.warn('Cache flushAll error:', err.message);
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async getStats(): Promise<{ keys: number; memory: string } | null> {
    try {
      const redis = getRedisClient();
      if (!redis) return null;

      const dbSize = await redis.dbsize();
      const info = await redis.info('memory');
      const memMatch = info.match(/used_memory_human:(.+)/);
      const memory = memMatch ? memMatch[1].trim() : 'unknown';

      return { keys: dbSize, memory };
    } catch (err: any) {
      logger.warn('Cache getStats error:', err.message);
      return null;
    }
  }
}

export const cacheService = new CacheService();
