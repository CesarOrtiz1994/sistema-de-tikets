import { z } from 'zod';

export const workScheduleValidators = {
  // Validación para un solo día de horario
  singleDay: z.object({
    dayOfWeek: z.number()
      .int('El día de la semana debe ser un número entero')
      .min(0, 'El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)')
      .max(6, 'El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)'),
    startHour: z.number()
      .int('La hora de inicio debe ser un número entero')
      .min(0, 'La hora de inicio debe ser entre 0 y 23')
      .max(23, 'La hora de inicio debe ser entre 0 y 23'),
    startMinute: z.number()
      .int('Los minutos de inicio deben ser un número entero')
      .min(0, 'Los minutos de inicio deben ser entre 0 y 59')
      .max(59, 'Los minutos de inicio deben ser entre 0 y 59')
      .optional()
      .default(0),
    endHour: z.number()
      .int('La hora de fin debe ser un número entero')
      .min(0, 'La hora de fin debe ser entre 0 y 23')
      .max(23, 'La hora de fin debe ser entre 0 y 23'),
    endMinute: z.number()
      .int('Los minutos de fin deben ser un número entero')
      .min(0, 'Los minutos de fin deben ser entre 0 y 59')
      .max(59, 'Los minutos de fin deben ser entre 0 y 59')
      .optional()
      .default(0),
    isWorkday: z.boolean()
  }).refine(
    (data) => {
      if (!data.isWorkday) return true; // Si no es día laboral, no validar horarios
      
      const startMinutes = data.startHour * 60 + (data.startMinute || 0);
      const endMinutes = data.endHour * 60 + (data.endMinute || 0);
      
      return endMinutes > startMinutes;
    },
    {
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['endHour']
    }
  ),

  // Validación para configurar horario completo (7 días)
  setSchedule: z.object({
    schedules: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startHour: z.number().int().min(0).max(23),
        startMinute: z.number().int().min(0).max(59).optional().default(0),
        endHour: z.number().int().min(0).max(23),
        endMinute: z.number().int().min(0).max(59).optional().default(0),
        isWorkday: z.boolean()
      }).refine(
        (data) => {
          if (!data.isWorkday) return true;
          const startMinutes = data.startHour * 60 + (data.startMinute || 0);
          const endMinutes = data.endHour * 60 + (data.endMinute || 0);
          return endMinutes > startMinutes;
        },
        {
          message: 'La hora de fin debe ser posterior a la hora de inicio',
          path: ['endHour']
        }
      )
    )
      .length(7, 'Debe proporcionar exactamente 7 días de horario (Domingo a Sábado)')
      .refine(
        (schedules) => {
          // Verificar que todos los días de la semana estén presentes (0-6)
          const days = schedules.map(s => s.dayOfWeek).sort();
          return days.every((day, index) => day === index);
        },
        {
          message: 'Debe incluir todos los días de la semana (0-6) sin duplicados'
        }
      )
  }),

  // Validación para actualizar un solo día
  updateDay: z.object({
    startHour: z.number().int().min(0).max(23),
    startMinute: z.number().int().min(0).max(59).optional().default(0),
    endHour: z.number().int().min(0).max(23),
    endMinute: z.number().int().min(0).max(59).optional().default(0),
    isWorkday: z.boolean()
  }).refine(
    (data) => {
      if (!data.isWorkday) return true;
      const startMinutes = data.startHour * 60 + (data.startMinute || 0);
      const endMinutes = data.endHour * 60 + (data.endMinute || 0);
      return endMinutes > startMinutes;
    },
    {
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['endHour']
    }
  ),

  // Validación para parámetros de día
  dayParam: z.object({
    day: z.string()
      .regex(/^[0-6]$/, 'El día debe ser un número entre 0 y 6')
      .transform(Number)
  })
};
