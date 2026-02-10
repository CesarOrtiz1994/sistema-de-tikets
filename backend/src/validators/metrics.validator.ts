import { z } from 'zod';

export const metricsValidators = {
  // Filtros generales para métricas
  dashboardFilters: z.object({
    departmentId: z.string().uuid('departmentId debe ser UUID válido').optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month')
  }),

  // Filtros para tickets por estado
  ticketsByStatus: z.object({
    departmentId: z.string().uuid('departmentId debe ser UUID válido').optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  // Filtros para tickets por departamento
  ticketsByDepartment: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  // Filtros para tiempo promedio de resolución
  avgResolutionTime: z.object({
    departmentId: z.string().uuid('departmentId debe ser UUID válido').optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  // Filtros para satisfacción
  satisfaction: z.object({
    departmentId: z.string().uuid('departmentId debe ser UUID válido').optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  // Filtros para cumplimiento SLA
  slaCompliance: z.object({
    departmentId: z.string().uuid('departmentId debe ser UUID válido').optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  // Filtros para tendencia de tickets
  ticketsTrend: z.object({
    departmentId: z.string().uuid('departmentId debe ser UUID válido').optional(),
    period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  })
};
