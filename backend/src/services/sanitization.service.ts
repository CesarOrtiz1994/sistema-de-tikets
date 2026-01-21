import validator from 'validator';
import logger from '../config/logger';

/**
 * Servicio para sanitizar inputs y prevenir XSS, SQL injection, etc.
 */
export class SanitizationService {
  /**
   * Sanitiza un string removiendo HTML peligroso y scripts
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Escapar HTML peligroso
    return validator.escape(input);
  }

  /**
   * Sanitiza un objeto completo recursivamente
   */
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeHtml(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitizar la key también
        const sanitizedKey = validator.escape(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitiza form_data antes de guardarlo en BD
   */
  sanitizeFormData(formData: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [fieldId, value] of Object.entries(formData)) {
      // No sanitizar IDs de campos (son UUIDs)
      if (value === null || value === undefined) {
        sanitized[fieldId] = value;
        continue;
      }

      // Sanitizar según tipo
      if (typeof value === 'string') {
        sanitized[fieldId] = this.sanitizeHtml(value);
      } else if (Array.isArray(value)) {
        // Para arrays (multiselect, checkbox, archivos)
        sanitized[fieldId] = value.map(item => {
          if (typeof item === 'string') {
            return this.sanitizeHtml(item);
          }
          if (typeof item === 'object') {
            return this.sanitizeObject(item);
          }
          return item;
        });
      } else if (typeof value === 'object') {
        sanitized[fieldId] = this.sanitizeObject(value);
      } else {
        // Números, booleanos, etc.
        sanitized[fieldId] = value;
      }
    }

    return sanitized;
  }

  /**
   * Valida y sanitiza una URL
   */
  sanitizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Validar que sea una URL válida
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      logger.warn(`URL inválida detectada: ${url}`);
      return null;
    }

    return url;
  }

  /**
   * Sanitiza un email
   */
  sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const normalized = validator.normalizeEmail(email);
    if (!normalized || !validator.isEmail(normalized)) {
      logger.warn(`Email inválido detectado: ${email}`);
      return null;
    }

    return normalized;
  }

  /**
   * Detecta y previene inyección SQL en strings
   */
  detectSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Patrones comunes de SQL injection
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(\bOR\b.*=.*)/gi,
      /(\bAND\b.*=.*)/gi,
      /(;|\||&)/g
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        logger.warn(`Posible SQL injection detectado: ${input.substring(0, 50)}...`);
        return true;
      }
    }

    return false;
  }

  /**
   * Detecta XSS en strings
   */
  detectXss(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Patrones comunes de XSS
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // onclick, onload, etc.
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        logger.warn(`Posible XSS detectado: ${input.substring(0, 50)}...`);
        return true;
      }
    }

    return false;
  }

  /**
   * Sanitiza y valida input completo, detectando ataques
   */
  validateAndSanitize(input: string): { safe: boolean; sanitized: string; threats: string[] } {
    const threats: string[] = [];

    if (this.detectSqlInjection(input)) {
      threats.push('SQL_INJECTION');
    }

    if (this.detectXss(input)) {
      threats.push('XSS');
    }

    const sanitized = this.sanitizeHtml(input);

    return {
      safe: threats.length === 0,
      sanitized,
      threats
    };
  }
}

export const sanitizationService = new SanitizationService();
