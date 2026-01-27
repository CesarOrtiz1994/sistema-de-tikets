import prisma from '../config/database';
import logger from '../config/logger';

interface WorkScheduleData {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startHour: number; // 0-23
  startMinute?: number; // 0-59
  endHour: number; // 0-23
  endMinute?: number; // 0-59
  isWorkday: boolean;
}

interface WorkSchedule extends WorkScheduleData {
  id: string;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

class DepartmentWorkScheduleService {
  /**
   * Obtiene el horario laboral de un departamento
   * Si no tiene configuración personalizada, retorna el horario por defecto
   */
  async getDepartmentSchedule(departmentId: string): Promise<WorkSchedule[]> {
    const schedules = await prisma.departmentWorkSchedule.findMany({
      where: { departmentId },
      orderBy: { dayOfWeek: 'asc' }
    });

    // Si no tiene horarios configurados, retornar horario por defecto
    if (schedules.length === 0) {
      return this.getDefaultSchedule();
    }

    return schedules;
  }

  /**
   * Retorna el horario laboral por defecto (Lunes-Viernes 9:00-18:00)
   */
  getDefaultSchedule(): WorkSchedule[] {
    const defaultSchedules: WorkSchedule[] = [];
    
    for (let day = 0; day <= 6; day++) {
      const isWorkday = day >= 1 && day <= 5; // Lunes a Viernes
      
      defaultSchedules.push({
        id: `default-${day}`,
        departmentId: 'default',
        dayOfWeek: day,
        startHour: 9,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
        isWorkday,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return defaultSchedules;
  }

  /**
   * Configura el horario laboral completo de un departamento (7 días)
   */
  async setDepartmentSchedule(
    departmentId: string,
    schedules: WorkScheduleData[]
  ): Promise<WorkSchedule[]> {
    // Validar que se proporcionen los 7 días
    if (schedules.length !== 7) {
      throw new Error('Debe proporcionar configuración para los 7 días de la semana');
    }

    // Validar que cada día esté presente una sola vez
    const days = schedules.map(s => s.dayOfWeek);
    const uniqueDays = new Set(days);
    if (uniqueDays.size !== 7) {
      throw new Error('Cada día debe aparecer exactamente una vez');
    }

    // Validar rangos de horas
    for (const schedule of schedules) {
      this.validateSchedule(schedule);
    }

    // Eliminar horarios existentes y crear los nuevos en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Eliminar horarios existentes
      await tx.departmentWorkSchedule.deleteMany({
        where: { departmentId }
      });

      // Crear nuevos horarios
      const created = await Promise.all(
        schedules.map(schedule =>
          tx.departmentWorkSchedule.create({
            data: {
              departmentId,
              dayOfWeek: schedule.dayOfWeek,
              startHour: schedule.startHour,
              startMinute: schedule.startMinute || 0,
              endHour: schedule.endHour,
              endMinute: schedule.endMinute || 0,
              isWorkday: schedule.isWorkday
            }
          })
        )
      );

      return created;
    });

    logger.info(`Horario laboral configurado para departamento ${departmentId}`);
    return result;
  }

  /**
   * Actualiza el horario de un día específico
   */
  async updateDaySchedule(
    departmentId: string,
    dayOfWeek: number,
    scheduleData: Omit<WorkScheduleData, 'dayOfWeek'>
  ): Promise<WorkSchedule> {
    this.validateSchedule({ ...scheduleData, dayOfWeek });

    // Buscar si existe
    const existing = await prisma.departmentWorkSchedule.findUnique({
      where: {
        departmentId_dayOfWeek: {
          departmentId,
          dayOfWeek
        }
      }
    });

    if (existing) {
      // Actualizar
      return await prisma.departmentWorkSchedule.update({
        where: { id: existing.id },
        data: {
          startHour: scheduleData.startHour,
          startMinute: scheduleData.startMinute || 0,
          endHour: scheduleData.endHour,
          endMinute: scheduleData.endMinute || 0,
          isWorkday: scheduleData.isWorkday
        }
      });
    } else {
      // Crear
      return await prisma.departmentWorkSchedule.create({
        data: {
          departmentId,
          dayOfWeek,
          startHour: scheduleData.startHour,
          startMinute: scheduleData.startMinute || 0,
          endHour: scheduleData.endHour,
          endMinute: scheduleData.endMinute || 0,
          isWorkday: scheduleData.isWorkday
        }
      });
    }
  }

  /**
   * Elimina la configuración personalizada de un departamento
   * (volverá a usar el horario por defecto)
   */
  async resetToDefaultSchedule(departmentId: string): Promise<void> {
    await prisma.departmentWorkSchedule.deleteMany({
      where: { departmentId }
    });

    logger.info(`Horario laboral reseteado a default para departamento ${departmentId}`);
  }

  /**
   * Verifica si un departamento tiene horario personalizado
   */
  async hasCustomSchedule(departmentId: string): Promise<boolean> {
    const count = await prisma.departmentWorkSchedule.count({
      where: { departmentId }
    });

    return count > 0;
  }

  /**
   * Valida que los datos del horario sean correctos
   */
  private validateSchedule(schedule: WorkScheduleData): void {
    // Validar día de la semana
    if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      throw new Error('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)');
    }

    // Si no es día laboral, no validar horas
    if (!schedule.isWorkday) {
      return;
    }

    // Validar horas
    if (schedule.startHour < 0 || schedule.startHour > 23) {
      throw new Error('startHour debe estar entre 0 y 23');
    }
    if (schedule.endHour < 0 || schedule.endHour > 23) {
      throw new Error('endHour debe estar entre 0 y 23');
    }

    // Validar minutos
    const startMinute = schedule.startMinute || 0;
    const endMinute = schedule.endMinute || 0;
    
    if (startMinute < 0 || startMinute > 59) {
      throw new Error('startMinute debe estar entre 0 y 59');
    }
    if (endMinute < 0 || endMinute > 59) {
      throw new Error('endMinute debe estar entre 0 y 59');
    }

    // Validar que la hora de inicio sea menor que la de fin
    const startTotalMinutes = schedule.startHour * 60 + startMinute;
    const endTotalMinutes = schedule.endHour * 60 + endMinute;

    if (startTotalMinutes >= endTotalMinutes) {
      throw new Error('La hora de inicio debe ser menor que la hora de fin');
    }
  }

  /**
   * Obtiene una descripción legible del horario
   */
  getDayScheduleDescription(schedule: WorkSchedule): string {
    if (!schedule.isWorkday) {
      return `${DAY_NAMES[schedule.dayOfWeek]}: No laboral`;
    }

    const startMinute = schedule.startMinute || 0;
    const endMinute = schedule.endMinute || 0;
    const startTime = `${schedule.startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    const endTime = `${schedule.endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    return `${DAY_NAMES[schedule.dayOfWeek]}: ${startTime} - ${endTime}`;
  }
}

export default new DepartmentWorkScheduleService();
