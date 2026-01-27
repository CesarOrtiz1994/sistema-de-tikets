import prisma from '../config/database';
import departmentWorkScheduleService from './departmentWorkSchedule.service';

interface CalculateSLADeadlineParams {
  slaConfigurationId: string;
  departmentId?: string;
  createdAt?: Date;
  businessHoursOnly?: boolean;
}

interface WorkSchedule {
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  isWorkday: boolean;
}

interface SLADeadlines {
  responseDeadline: Date;
  resolutionDeadline: Date;
  escalationDeadline: Date | null;
  notifyBefore: Date | null;
  slaStartTime: Date; // Cuándo comienza a contar el SLA
  createdOutsideBusinessHours: boolean; // Si fue creado fuera de horario
}

class SLADeadlineService {
  async calculateSLADeadline(params: CalculateSLADeadlineParams): Promise<SLADeadlines> {
    const { slaConfigurationId, departmentId, createdAt = new Date() } = params;

    const slaConfig = await prisma.sLAConfiguration.findUnique({
      where: { id: slaConfigurationId }
    });

    if (!slaConfig) {
      throw new Error('SLA Configuration not found');
    }

    const startTime = new Date(createdAt);

    // Obtener horario del departamento si está disponible
    let workSchedules: WorkSchedule[] | null = null;
    if (departmentId && slaConfig.businessHoursOnly) {
      const schedules = await departmentWorkScheduleService.getDepartmentSchedule(departmentId);
      workSchedules = schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startHour: s.startHour,
        startMinute: s.startMinute || 0,
        endHour: s.endHour,
        endMinute: s.endMinute || 0,
        isWorkday: s.isWorkday
      }));
    }

    // Calcular cuándo comienza a contar el SLA (ajustado a horario laboral)
    const slaStartTime = this.calculateSLAStartTime(
      startTime,
      slaConfig.businessHoursOnly,
      workSchedules
    );

    // Determinar si fue creado fuera de horario
    const createdOutsideBusinessHours = slaConfig.businessHoursOnly && 
      slaStartTime.getTime() !== startTime.getTime();

    // Calcular deadline de respuesta
    const responseDeadline = this.addMinutes(
      startTime,
      slaConfig.responseTime,
      slaConfig.businessHoursOnly,
      workSchedules
    );

    // Calcular deadline de resolución
    const resolutionDeadline = this.addMinutes(
      startTime,
      slaConfig.resolutionTime,
      slaConfig.businessHoursOnly,
      workSchedules
    );

    // Calcular deadline de escalamiento si está habilitado
    let escalationDeadline: Date | null = null;
    if (slaConfig.escalationEnabled && slaConfig.escalationTime) {
      escalationDeadline = this.addMinutes(
        startTime,
        slaConfig.escalationTime,
        slaConfig.businessHoursOnly,
        workSchedules
      );
    }

    // Calcular cuándo notificar antes del breach
    let notifyBefore: Date | null = null;
    if (slaConfig.notifyOnBreach && slaConfig.notifyBefore) {
      notifyBefore = this.subtractMinutes(
        resolutionDeadline,
        slaConfig.notifyBefore
      );
    }

    return {
      responseDeadline,
      resolutionDeadline,
      escalationDeadline,
      notifyBefore,
      slaStartTime,
      createdOutsideBusinessHours
    };
  }

  /**
   * Calcula cuándo comienza a contar el SLA (ajustado a horario laboral)
   */
  private calculateSLAStartTime(
    date: Date,
    businessHoursOnly: boolean,
    workSchedules: WorkSchedule[] | null
  ): Date {
    if (!businessHoursOnly) {
      // Si no es solo horario laboral, comienza inmediatamente
      return new Date(date);
    }

    // Si no hay horarios personalizados, usar horario por defecto
    if (!workSchedules || workSchedules.length === 0) {
      return this.adjustToBusinessHoursDefault(date);
    }

    // Usar horarios personalizados del departamento
    return this.adjustToBusinessHoursCustom(date, workSchedules);
  }

  /**
   * Ajusta una fecha al horario laboral por defecto (Lunes-Viernes 9:00-18:00)
   */
  private adjustToBusinessHoursDefault(date: Date): Date {
    const WORK_START_HOUR = 9;
    const WORK_END_HOUR = 18;
    
    let currentDate = new Date(date);

    // Si es fin de semana, ajustar al siguiente día laboral
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate = this.skipToNextWorkdayDefault(currentDate);
      return currentDate;
    }

    // Si está antes del horario laboral, ajustar a la hora de inicio
    if (currentDate.getHours() < WORK_START_HOUR) {
      currentDate.setHours(WORK_START_HOUR, 0, 0, 0);
      return currentDate;
    }

    // Si está después del horario laboral, ajustar al siguiente día laboral
    if (currentDate.getHours() >= WORK_END_HOUR) {
      currentDate = this.skipToNextWorkdayDefault(currentDate);
      return currentDate;
    }

    // Está dentro del horario laboral
    return currentDate;
  }

  /**
   * Ajusta una fecha al horario laboral personalizado
   */
  private adjustToBusinessHoursCustom(date: Date, workSchedules: WorkSchedule[]): Date {
    let currentDate = new Date(date);
    
    // Crear un mapa de horarios por día
    const scheduleMap = new Map<number, WorkSchedule>();
    workSchedules.forEach(s => scheduleMap.set(s.dayOfWeek, s));

    const daySchedule = scheduleMap.get(currentDate.getDay());

    // Si no es día laboral, ajustar al siguiente día laboral
    if (!daySchedule || !daySchedule.isWorkday) {
      currentDate = this.skipToNextWorkday(currentDate, scheduleMap);
      return currentDate;
    }

    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = daySchedule.startHour * 60 + daySchedule.startMinute;
    const endTotalMinutes = daySchedule.endHour * 60 + daySchedule.endMinute;

    // Si está antes del horario laboral, ajustar a la hora de inicio
    if (currentTotalMinutes < startTotalMinutes) {
      currentDate.setHours(daySchedule.startHour, daySchedule.startMinute, 0, 0);
      return currentDate;
    }

    // Si está después del horario laboral, ajustar al siguiente día laboral
    if (currentTotalMinutes >= endTotalMinutes) {
      currentDate = this.skipToNextWorkday(currentDate, scheduleMap);
      return currentDate;
    }

    // Está dentro del horario laboral
    return currentDate;
  }

  private addMinutes(date: Date, minutes: number, businessHoursOnly: boolean, workSchedules: WorkSchedule[] | null = null): Date {
    if (!businessHoursOnly) {
      // Si no es solo horario laboral, simplemente sumar minutos
      return new Date(date.getTime() + minutes * 60000);
    }

    // Si no hay horarios personalizados, usar horario por defecto
    if (!workSchedules || workSchedules.length === 0) {
      return this.addMinutesWithDefaultSchedule(date, minutes);
    }

    // Usar horarios personalizados del departamento
    return this.addMinutesWithCustomSchedule(date, minutes, workSchedules);
  }

  /**
   * Calcula deadline usando horario por defecto (Lunes-Viernes 9:00-18:00)
   */
  private addMinutesWithDefaultSchedule(date: Date, minutes: number): Date {
    const WORK_START_HOUR = 9;
    const WORK_END_HOUR = 18;

    let currentDate = new Date(date);
    let remainingMinutes = minutes;

    // Ajustar al siguiente día laboral si es fin de semana
    currentDate = this.skipToNextWorkdayDefault(currentDate);

    // Ajustar a la hora de inicio si está fuera del horario laboral
    if (currentDate.getHours() < WORK_START_HOUR) {
      currentDate.setHours(WORK_START_HOUR, 0, 0, 0);
    } else if (currentDate.getHours() >= WORK_END_HOUR) {
      currentDate = this.skipToNextWorkdayDefault(currentDate);
      currentDate.setHours(WORK_START_HOUR, 0, 0, 0);
    }

    while (remainingMinutes > 0) {
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();

      // Minutos restantes en el día laboral actual
      const minutesUntilEndOfDay = (WORK_END_HOUR - currentHour) * 60 - currentMinute;

      if (remainingMinutes <= minutesUntilEndOfDay) {
        // Los minutos restantes caben en el día actual
        currentDate = new Date(currentDate.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        // Necesitamos más días
        remainingMinutes -= minutesUntilEndOfDay;
        currentDate = this.skipToNextWorkdayDefault(currentDate);
        currentDate.setHours(WORK_START_HOUR, 0, 0, 0);
      }
    }

    return currentDate;
  }

  /**
   * Calcula deadline usando horarios personalizados del departamento
   */
  private addMinutesWithCustomSchedule(date: Date, minutes: number, workSchedules: WorkSchedule[]): Date {
    let currentDate = new Date(date);
    let remainingMinutes = minutes;

    // Crear un mapa de horarios por día
    const scheduleMap = new Map<number, WorkSchedule>();
    workSchedules.forEach(s => scheduleMap.set(s.dayOfWeek, s));

    // Ajustar al siguiente día laboral si es necesario
    currentDate = this.skipToNextWorkday(currentDate, scheduleMap);

    // Obtener horario del día actual
    let daySchedule = scheduleMap.get(currentDate.getDay());
    if (!daySchedule || !daySchedule.isWorkday) {
      currentDate = this.skipToNextWorkday(currentDate, scheduleMap);
      daySchedule = scheduleMap.get(currentDate.getDay())!;
    }

    // Ajustar a la hora de inicio si está fuera del horario laboral
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = daySchedule.startHour * 60 + daySchedule.startMinute;
    const endTotalMinutes = daySchedule.endHour * 60 + daySchedule.endMinute;

    if (currentTotalMinutes < startTotalMinutes) {
      currentDate.setHours(daySchedule.startHour, daySchedule.startMinute, 0, 0);
    } else if (currentTotalMinutes >= endTotalMinutes) {
      currentDate = this.skipToNextWorkday(currentDate, scheduleMap);
      daySchedule = scheduleMap.get(currentDate.getDay())!;
      currentDate.setHours(daySchedule.startHour, daySchedule.startMinute, 0, 0);
    }

    while (remainingMinutes > 0) {
      daySchedule = scheduleMap.get(currentDate.getDay())!;
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const endTotalMinutes = daySchedule.endHour * 60 + daySchedule.endMinute;

      // Minutos restantes en el día laboral actual
      const minutesUntilEndOfDay = endTotalMinutes - currentTotalMinutes;

      if (remainingMinutes <= minutesUntilEndOfDay) {
        // Los minutos restantes caben en el día actual
        currentDate = new Date(currentDate.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        // Necesitamos más días
        remainingMinutes -= minutesUntilEndOfDay;
        currentDate = this.skipToNextWorkday(currentDate, scheduleMap);
        daySchedule = scheduleMap.get(currentDate.getDay())!;
        currentDate.setHours(daySchedule.startHour, daySchedule.startMinute, 0, 0);
      }
    }

    return currentDate;
  }

  /**
   * Salta al siguiente día laboral usando horarios personalizados
   */
  private skipToNextWorkday(date: Date, scheduleMap: Map<number, WorkSchedule>): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);

    // Buscar el siguiente día laboral (máximo 7 intentos)
    let attempts = 0;
    while (attempts < 7) {
      const daySchedule = scheduleMap.get(result.getDay());
      if (daySchedule && daySchedule.isWorkday) {
        result.setHours(daySchedule.startHour, daySchedule.startMinute, 0, 0);
        return result;
      }
      result.setDate(result.getDate() + 1);
      attempts++;
    }

    // Si no hay días laborales configurados, usar lunes por defecto
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }
    result.setHours(9, 0, 0, 0);
    return result;
  }

  private subtractMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * 60000);
  }

  /**
   * Salta al siguiente día laboral (versión para horario por defecto)
   */
  private skipToNextWorkdayDefault(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    result.setHours(9, 0, 0, 0);

    // Si es sábado (6) o domingo (0), avanzar al lunes
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  async getSLAStatus(_createdAt: Date, deadlines: SLADeadlines) {
    const now = new Date();

    return {
      isResponseBreached: now > deadlines.responseDeadline,
      isResolutionBreached: now > deadlines.resolutionDeadline,
      shouldEscalate: deadlines.escalationDeadline ? now > deadlines.escalationDeadline : false,
      shouldNotify: deadlines.notifyBefore ? now > deadlines.notifyBefore : false,
      timeUntilResponseDeadline: this.getTimeDifference(now, deadlines.responseDeadline),
      timeUntilResolutionDeadline: this.getTimeDifference(now, deadlines.resolutionDeadline)
    };
  }

  private getTimeDifference(from: Date, to: Date): number {
    return Math.max(0, to.getTime() - from.getTime());
  }
}

export default new SLADeadlineService();
