import { z } from 'zod';

// ============================================
// FUNCIONES DE SEGURIDAD
// ============================================

// Patrones peligrosos que pueden indicar inyección de código
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,  // Scripts HTML
  /javascript:/gi,                  // JavaScript en URLs
  /on\w+\s*=/gi,                   // Event handlers (onclick, onerror, etc)
  /<iframe/gi,                      // iframes
  /<object/gi,                      // objects
  /<embed/gi,                       // embeds
  /eval\(/gi,                       // eval()
  /expression\(/gi,                 // CSS expressions
  /vbscript:/gi,                    // VBScript
  /data:text\/html/gi,              // Data URLs con HTML
  /<\?php/gi,                       // PHP tags
  /<%/gi,                           // ASP/JSP tags
  /\$\{/g,                          // Template literals
  /`.*`/g,                          // Backticks (template strings)
];

// Patrones SQL peligrosos
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|;|\/\*|\*\/)/g,              // Comentarios SQL
  /('|")\s*(OR|AND)\s*('|")/gi,     // OR/AND injection
  /\bOR\b\s+\d+\s*=\s*\d+/gi,       // OR 1=1
];

/**
 * Valida que un string no contenga patrones peligrosos de XSS
 */
export function validateNoXSS(value: string): boolean {
  if (typeof value !== 'string') return true;
  
  return !DANGEROUS_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Valida que un string no contenga patrones de SQL injection
 */
export function validateNoSQLInjection(value: string): boolean {
  if (typeof value !== 'string') return true;
  
  return !SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Validación combinada de seguridad
 */
export function validateSecureString(value: string): boolean {
  return validateNoXSS(value) && validateNoSQLInjection(value);
}

/**
 * Refinamiento de Zod para validar seguridad
 */
export const secureStringRefinement = (value: string) => {
  if (!validateNoXSS(value)) {
    return false;
  }
  if (!validateNoSQLInjection(value)) {
    return false;
  }
  return true;
};

// ============================================
// ESQUEMAS DE VALIDACIÓN PARA USUARIOS
// ============================================

export const userSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .refine(validateSecureString, {
      message: 'El nombre contiene caracteres no permitidos o código potencialmente peligroso'
    }),
  email: z.string()
    .email('Email inválido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .refine(validateSecureString, {
      message: 'El email contiene caracteres no permitidos'
    }),
  roleType: z.enum(['SUPER_ADMIN', 'DEPT_ADMIN', 'SUBORDINATE', 'REQUESTER']),
  departmentId: z.string().optional(),
  departmentRole: z.enum(['ADMIN', 'MEMBER']).optional()
});

export const updateUserSchema = userSchema.partial();

// ============================================
// ESQUEMAS DE VALIDACIÓN PARA DEPARTAMENTOS
// ============================================

export const departmentSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .refine(validateSecureString, {
      message: 'El nombre contiene caracteres no permitidos o código potencialmente peligroso'
    }),
  prefix: z.string()
    .min(2, 'El prefijo debe tener al menos 2 caracteres')
    .max(10, 'El prefijo no puede exceder 10 caracteres')
    .regex(/^[A-Z0-9]+$/, 'El prefijo solo puede contener letras mayúsculas y números')
    .refine(validateSecureString, {
      message: 'El prefijo contiene caracteres no permitidos'
    }),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .refine((val) => !val || validateSecureString(val), {
      message: 'La descripción contiene caracteres no permitidos o código potencialmente peligroso'
    })
    .optional()
    .or(z.literal('')),
  isDefaultForRequesters: z.boolean().optional()
});

export const updateDepartmentSchema = departmentSchema.partial();

// ============================================
// ESQUEMAS DE VALIDACIÓN PARA ASIGNACIÓN DE USUARIOS
// ============================================

export const assignUserSchema = z.object({
  userId: z.string()
    .min(1, 'Debes seleccionar un usuario'),
  role: z.enum(['ADMIN', 'MEMBER'])
});

// ============================================
// ESQUEMAS DE VALIDACIÓN PARA SLA
// ============================================

export const slaConfigurationSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .refine(validateSecureString, {
      message: 'El nombre contiene caracteres no permitidos o código potencialmente peligroso'
    }),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .refine((val) => !val || validateSecureString(val), {
      message: 'La descripción contiene caracteres no permitidos o código potencialmente peligroso'
    })
    .optional()
    .nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  responseTime: z.number()
    .min(1, 'El tiempo de respuesta debe ser al menos 1 minuto')
    .max(43200, 'El tiempo de respuesta no puede exceder 30 días'),
  resolutionTime: z.number()
    .min(1, 'El tiempo de resolución debe ser al menos 1 minuto')
    .max(43200, 'El tiempo de resolución no puede exceder 30 días'),
  escalationEnabled: z.boolean(),
  escalationTime: z.number()
    .min(1, 'El tiempo de escalamiento debe ser al menos 1 minuto')
    .max(43200, 'El tiempo de escalamiento no puede exceder 30 días')
    .optional()
    .nullable(),
  businessHoursOnly: z.boolean(),
  notifyOnBreach: z.boolean(),
  notifyBefore: z.number()
    .min(1, 'La notificación debe ser al menos 1 minuto antes')
    .max(1440, 'La notificación no puede exceder 24 horas')
    .optional()
    .nullable()
}).refine(
  (data) => data.resolutionTime > data.responseTime,
  {
    message: 'El tiempo de resolución debe ser mayor al tiempo de respuesta',
    path: ['resolutionTime']
  }
).refine(
  (data) => !data.escalationEnabled || (data.escalationTime && data.escalationTime > 0),
  {
    message: 'Debes especificar el tiempo de escalamiento si está habilitado',
    path: ['escalationTime']
  }
);

// ============================================
// TIPOS INFERIDOS DE LOS ESQUEMAS
// ============================================

export type UserFormData = z.infer<typeof userSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type UpdateDepartmentFormData = z.infer<typeof updateDepartmentSchema>;
export type AssignUserFormData = z.infer<typeof assignUserSchema>;
export type SLAConfigurationFormData = z.infer<typeof slaConfigurationSchema>;

// ============================================
// FUNCIÓN HELPER PARA VALIDAR FORMULARIOS
// ============================================

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'Error de validación desconocido' } };
  }
}

// ============================================
// FUNCIÓN HELPER PARA VALIDAR UN CAMPO
// ============================================

export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown,
  allData?: Partial<T>
): string | null {
  try {
    // Si tenemos todos los datos, validamos el campo en contexto
    if (allData) {
      schema.parse(allData);
    } else {
      // Validación individual del campo
      const fieldSchema = (schema as any).shape?.[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find((err: z.ZodIssue) => 
        err.path.join('.') === fieldName || err.path[0] === fieldName
      );
      return fieldError?.message || null;
    }
    return null;
  }
}
