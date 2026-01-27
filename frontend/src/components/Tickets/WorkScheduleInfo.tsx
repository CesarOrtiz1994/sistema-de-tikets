import { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import departmentWorkScheduleService, { WorkSchedule } from '../../services/departmentWorkSchedule.service';

interface WorkScheduleInfoProps {
  departmentId: string;
  departmentName: string;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function WorkScheduleInfo({ departmentId, departmentName }: WorkScheduleInfoProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, [departmentId]);

  const loadSchedules = async () => {
    try {
      const data = await departmentWorkScheduleService.getDepartmentSchedule(departmentId);
      setSchedules(data);
    } catch (error) {
      console.error('Error loading work schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Agrupar días laborales consecutivos con el mismo horario
  const workdays = schedules.filter(s => s.isWorkday);
  
  if (workdays.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <FiClock className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Horario de Atención - {departmentName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sin horario laboral configurado
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Encontrar el patrón más común de horario
  const scheduleGroups: { [key: string]: number[] } = {};
  
  workdays.forEach(schedule => {
    const key = `${schedule.startHour}:${schedule.startMinute}-${schedule.endHour}:${schedule.endMinute}`;
    if (!scheduleGroups[key]) {
      scheduleGroups[key] = [];
    }
    scheduleGroups[key].push(schedule.dayOfWeek);
  });

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <FiClock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Horario de Atención - {departmentName}
          </p>
          <div className="space-y-1">
            {Object.entries(scheduleGroups).map(([timeRange, days]) => {
              const [start, end] = timeRange.split('-');
              const dayNames = days.sort((a, b) => a - b).map(d => DAY_NAMES[d]);
              
              // Agrupar días consecutivos
              let dayRanges: string[] = [];
              let rangeStart = dayNames[0];
              let rangeEnd = rangeStart;
              
              for (let i = 1; i < dayNames.length; i++) {
                if (days[i] === days[i - 1] + 1) {
                  rangeEnd = dayNames[i];
                } else {
                  dayRanges.push(rangeStart === rangeEnd ? rangeStart : `${rangeStart}-${rangeEnd}`);
                  rangeStart = dayNames[i];
                  rangeEnd = rangeStart;
                }
              }
              dayRanges.push(rangeStart === rangeEnd ? rangeStart : `${rangeStart}-${rangeEnd}`);
              
              return (
                <p key={timeRange} className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>{dayRanges.join(', ')}</strong>: {start} - {end}
                </p>
              );
            })}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
            El cálculo de SLA solo cuenta tiempo dentro de este horario
          </p>
        </div>
      </div>
    </div>
  );
}
