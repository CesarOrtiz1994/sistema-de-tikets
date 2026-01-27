import api from './api';

export interface WorkSchedule {
  id: string;
  departmentId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  isWorkday: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkScheduleInput {
  dayOfWeek: number;
  startHour: number;
  startMinute?: number;
  endHour: number;
  endMinute?: number;
  isWorkday: boolean;
}

class DepartmentWorkScheduleService {
  /**
   * Obtiene el horario laboral de un departamento
   */
  async getDepartmentSchedule(departmentId: string): Promise<WorkSchedule[]> {
    const response = await api.get(`/api/departments/${departmentId}/work-schedule`);
    return response.data.data;
  }

  /**
   * Configura el horario laboral completo de un departamento (7 días)
   */
  async setDepartmentSchedule(
    departmentId: string,
    schedules: WorkScheduleInput[]
  ): Promise<WorkSchedule[]> {
    const response = await api.post(`/api/departments/${departmentId}/work-schedule`, {
      schedules
    });
    return response.data.data;
  }

  /**
   * Actualiza el horario de un día específico
   */
  async updateDaySchedule(
    departmentId: string,
    dayOfWeek: number,
    schedule: Omit<WorkScheduleInput, 'dayOfWeek'>
  ): Promise<WorkSchedule> {
    const response = await api.put(
      `/api/departments/${departmentId}/work-schedule/${dayOfWeek}`,
      schedule
    );
    return response.data.data;
  }

  /**
   * Resetea el horario a default (Lunes-Viernes 9:00-18:00)
   */
  async resetToDefaultSchedule(departmentId: string): Promise<void> {
    await api.delete(`/api/departments/${departmentId}/work-schedule`);
  }

  /**
   * Verifica si un departamento tiene horario personalizado
   */
  async hasCustomSchedule(departmentId: string): Promise<boolean> {
    const response = await api.get(`/api/departments/${departmentId}/work-schedule/custom`);
    return response.data.data.hasCustomSchedule;
  }

  /**
   * Genera horario por defecto para el formulario
   */
  getDefaultScheduleForForm(): WorkScheduleInput[] {
    const schedules: WorkScheduleInput[] = [];
    
    for (let day = 0; day <= 6; day++) {
      const isWorkday = day >= 1 && day <= 5; // Lunes a Viernes
      
      schedules.push({
        dayOfWeek: day,
        startHour: 9,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
        isWorkday
      });
    }

    return schedules;
  }

  /**
   * Formatea una hora para mostrar (HH:MM)
   */
  formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene el nombre del día en español
   */
  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  }
}

export default new DepartmentWorkScheduleService();
