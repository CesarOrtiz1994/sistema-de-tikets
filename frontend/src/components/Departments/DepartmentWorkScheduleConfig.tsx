import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiClock, FiRefreshCw, FiSave, FiAlertCircle } from 'react-icons/fi';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import departmentWorkScheduleService, { WorkScheduleInput } from '../../services/departmentWorkSchedule.service';

interface DepartmentWorkScheduleConfigProps {
  departmentId: string;
  onUpdate?: () => void;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DepartmentWorkScheduleConfig({ departmentId, onUpdate }: DepartmentWorkScheduleConfigProps) {
  const [schedules, setSchedules] = useState<WorkScheduleInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCustomSchedule, setHasCustomSchedule] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, [departmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, hasCustom] = await Promise.all([
        departmentWorkScheduleService.getDepartmentSchedule(departmentId),
        departmentWorkScheduleService.hasCustomSchedule(departmentId)
      ]);

      setHasCustomSchedule(hasCustom);
      
      // Convertir a formato de entrada
      const scheduleInputs: WorkScheduleInput[] = schedulesData.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startHour: s.startHour,
        startMinute: s.startMinute,
        endHour: s.endHour,
        endMinute: s.endMinute,
        isWorkday: s.isWorkday
      }));

      setSchedules(scheduleInputs);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Error al cargar los horarios laborales');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (dayOfWeek: number, field: keyof WorkScheduleInput, value: any) => {
    setSchedules(prev => prev.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { ...s, [field]: value }
        : s
    ));
    setHasChanges(true);
  };

  const handleToggleWorkday = (dayOfWeek: number) => {
    setSchedules(prev => prev.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { ...s, isWorkday: !s.isWorkday }
        : s
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validar que los horarios sean correctos
      for (const schedule of schedules) {
        if (schedule.isWorkday) {
          const startMinutes = schedule.startHour * 60 + (schedule.startMinute || 0);
          const endMinutes = schedule.endHour * 60 + (schedule.endMinute || 0);
          
          if (startMinutes >= endMinutes) {
            toast.error(`${DAY_NAMES[schedule.dayOfWeek]}: La hora de inicio debe ser menor que la hora de fin`);
            return;
          }
        }
      }

      await departmentWorkScheduleService.setDepartmentSchedule(departmentId, schedules);
      toast.success('Horario laboral guardado exitosamente');
      setHasChanges(false);
      setHasCustomSchedule(true);
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving schedules:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar el horario laboral';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Restablecer horario por defecto',
      message: '¿Estás seguro de que deseas restablecer el horario a la configuración por defecto (Lunes-Viernes 9:00-18:00)?',
      confirmText: 'Restablecer',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      setSaving(true);
      await departmentWorkScheduleService.resetToDefaultSchedule(departmentId);
      toast.success('Horario restablecido a configuración por defecto');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error resetting schedule:', error);
      toast.error('Error al restablecer el horario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiClock className="text-purple-600" />
                Horarios Laborales
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define los horarios de atención del departamento para el cálculo de SLA
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasCustomSchedule && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Restablecer a horario por defecto"
                >
                  <FiRefreshCw size={18} />
                  Restablecer
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSave size={18} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          {/* Info banner */}
          {!hasCustomSchedule && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <FiAlertCircle className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Horario por defecto activo</p>
                <p className="mt-1">
                  Actualmente se está usando el horario por defecto (Lunes-Viernes 9:00-18:00). 
                  Puedes personalizarlo según las necesidades de tu departamento.
                </p>
              </div>
            </div>
          )}

          {/* Schedule grid */}
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.dayOfWeek}
                className={`border rounded-lg p-4 transition-colors ${
                  schedule.isWorkday
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Day name and toggle */}
                  <div className="w-32 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={schedule.isWorkday}
                      onChange={() => handleToggleWorkday(schedule.dayOfWeek)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className={`font-medium ${
                      schedule.isWorkday 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {DAY_NAMES[schedule.dayOfWeek]}
                    </span>
                  </div>

                  {/* Time inputs */}
                  {schedule.isWorkday ? (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Inicio:</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={schedule.startHour}
                          onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'startHour', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <span className="text-gray-600 dark:text-gray-400">:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={schedule.startMinute || 0}
                          onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'startMinute', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <span className="text-gray-400">—</span>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Fin:</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={schedule.endHour}
                          onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'endHour', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <span className="text-gray-600 dark:text-gray-400">:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={schedule.endMinute || 0}
                          onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'endMinute', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                        {departmentWorkScheduleService.formatTime(schedule.startHour, schedule.startMinute || 0)} - {departmentWorkScheduleService.formatTime(schedule.endHour, schedule.endMinute || 0)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-gray-500 dark:text-gray-400 italic">
                      Día no laboral
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Nota:</strong> Los horarios laborales se utilizan para calcular los tiempos de respuesta y resolución de los SLA. 
              Los tickets creados fuera del horario laboral comenzarán a contar su SLA al inicio del siguiente día laboral.
            </p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
