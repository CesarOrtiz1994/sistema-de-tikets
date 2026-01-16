import prisma from '../config/database';

interface CalculateSLADeadlineParams {
  slaConfigurationId: string;
  createdAt?: Date;
  businessHoursOnly?: boolean;
}

interface SLADeadlines {
  responseDeadline: Date;
  resolutionDeadline: Date;
  escalationDeadline: Date | null;
  notifyBefore: Date | null;
}

class SLADeadlineService {
  async calculateSLADeadline(params: CalculateSLADeadlineParams): Promise<SLADeadlines> {
    const { slaConfigurationId, createdAt = new Date() } = params;

    const slaConfig = await prisma.sLAConfiguration.findUnique({
      where: { id: slaConfigurationId }
    });

    if (!slaConfig) {
      throw new Error('SLA Configuration not found');
    }

    const startTime = new Date(createdAt);

    // Calcular deadline de respuesta
    const responseDeadline = this.addMinutes(
      startTime,
      slaConfig.responseTime,
      slaConfig.businessHoursOnly
    );

    // Calcular deadline de resolución
    const resolutionDeadline = this.addMinutes(
      startTime,
      slaConfig.resolutionTime,
      slaConfig.businessHoursOnly
    );

    // Calcular deadline de escalamiento si está habilitado
    let escalationDeadline: Date | null = null;
    if (slaConfig.escalationEnabled && slaConfig.escalationTime) {
      escalationDeadline = this.addMinutes(
        startTime,
        slaConfig.escalationTime,
        slaConfig.businessHoursOnly
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
      notifyBefore
    };
  }

  private addMinutes(date: Date, minutes: number, businessHoursOnly: boolean): Date {
    if (!businessHoursOnly) {
      // Si no es solo horario laboral, simplemente sumar minutos
      return new Date(date.getTime() + minutes * 60000);
    }

    // Horario laboral: Lunes a Viernes, 9:00 AM - 6:00 PM
    const WORK_START_HOUR = 9;
    const WORK_END_HOUR = 18;

    let currentDate = new Date(date);
    let remainingMinutes = minutes;

    // Ajustar al siguiente día laboral si es fin de semana
    currentDate = this.skipToNextWorkday(currentDate);

    // Ajustar a la hora de inicio si está fuera del horario laboral
    if (currentDate.getHours() < WORK_START_HOUR) {
      currentDate.setHours(WORK_START_HOUR, 0, 0, 0);
    } else if (currentDate.getHours() >= WORK_END_HOUR) {
      currentDate = this.skipToNextWorkday(currentDate);
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
        currentDate = this.skipToNextWorkday(currentDate);
        currentDate.setHours(WORK_START_HOUR, 0, 0, 0);
      }
    }

    return currentDate;
  }

  private subtractMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * 60000);
  }

  private skipToNextWorkday(date: Date): Date {
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
