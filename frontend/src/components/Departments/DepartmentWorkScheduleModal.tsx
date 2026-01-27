import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiClock, FiRotateCcw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Modal from '../common/Modal';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import ModalButtons from '../common/ModalButtons';
import ValidationError from '../common/ValidationError';
import ConfirmDialog from '../common/ConfirmDialog';
import departmentWorkScheduleService, { WorkScheduleInput } from '../../services/departmentWorkSchedule.service';
import { workScheduleArraySchema } from '../../validators/workSchedule.validator';
import { ZodError } from 'zod';

interface DepartmentWorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  departmentId: string;
  departmentName: string;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DepartmentWorkScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  departmentId,
  departmentName
}: DepartmentWorkScheduleModalProps) {
  const [schedules, setSchedules] = useState<WorkScheduleInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasCustomSchedule, setHasCustomSchedule] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSchedules();
    }
  }, [isOpen, departmentId]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [scheduleData, hasCustom] = await Promise.all([
        departmentWorkScheduleService.getDepartmentSchedule(departmentId),
        departmentWorkScheduleService.hasCustomSchedule(departmentId)
      ]);

      setHasCustomSchedule(hasCustom);

      if (scheduleData.length > 0) {
        setSchedules(scheduleData.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startHour: s.startHour,
          startMinute: s.startMinute,
          endHour: s.endHour,
          endMinute: s.endMinute,
          isWorkday: s.isWorkday
        })));
      } else {
        setSchedules(departmentWorkScheduleService.getDefaultScheduleForForm());
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Error al cargar horarios');
      setSchedules(departmentWorkScheduleService.getDefaultScheduleForForm());
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar con Zod
    try {
      workScheduleArraySchema.parse(schedules);
      setValidationErrors({});
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const path = issue.path.join('.');
          errors[path] = issue.message;
        });
        setValidationErrors(errors);
        toast.error('Por favor corrige los errores de validación');
        return;
      }
    }

    setSaving(true);
    try {
      await departmentWorkScheduleService.setDepartmentSchedule(departmentId, schedules);
      toast.success('Horario laboral configurado exitosamente');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving schedules:', error);
      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          backendErrors[err.path] = err.message;
        });
        setValidationErrors(backendErrors);
      }
      toast.error(error.response?.data?.message || 'Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setSaving(true);
    try {
      await departmentWorkScheduleService.resetToDefaultSchedule(departmentId);
      toast.success('Horario reseteado a configuración por defecto');
      await loadSchedules();
      onSuccess?.();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting schedule:', error);
      toast.error('Error al resetear horario');
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = (dayOfWeek: number, field: keyof WorkScheduleInput, value: any) => {
    setSchedules(prev => prev.map(s => 
      s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
    ));
    // Limpiar errores de validación al editar
    setValidationErrors({});
  };

  const toggleWorkday = (dayOfWeek: number) => {
    setSchedules(prev => prev.map(s => 
      s.dayOfWeek === dayOfWeek ? { ...s, isWorkday: !s.isWorkday } : s
    ));
  };

  const applyToAllWorkdays = () => {
    const monday = schedules.find(s => s.dayOfWeek === 1);
    if (!monday) return;

    setSchedules(prev => prev.map(s => {
      if (s.dayOfWeek >= 1 && s.dayOfWeek <= 5 && s.isWorkday) {
        return {
          ...s,
          startHour: monday.startHour,
          startMinute: monday.startMinute,
          endHour: monday.endHour,
          endMinute: monday.endMinute
        };
      }
      return s;
    }));

    toast.success('Horario de lunes aplicado a todos los días laborales');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurar Horario Laboral - ${departmentName}`}
      size="xl"
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Horario Laboral Personalizado
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Configura los días y horarios laborales de este departamento. El cálculo de SLA solo contará
                  minutos dentro del horario laboral configurado.
                </p>
                {hasCustomSchedule && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                    ✓ Este departamento tiene horario personalizado
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón para aplicar a todos */}
          <div className="flex justify-end">
            <button
              onClick={applyToAllWorkdays}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Aplicar horario de Lunes a todos los días laborales
            </button>
          </div>

          {/* Configuración por día */}
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <Card key={schedule.dayOfWeek}>
                <div className="flex items-center gap-4">
                  {/* Día de la semana */}
                  <div className="w-32">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {DAY_NAMES[schedule.dayOfWeek]}
                    </span>
                  </div>

                  {/* Toggle día laboral */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWorkday(schedule.dayOfWeek)}
                      className={`p-2 rounded-lg transition-colors ${
                        schedule.isWorkday
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}
                    >
                      {schedule.isWorkday ? <FiCheckCircle className="w-5 h-5" /> : <FiXCircle className="w-5 h-5" />}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {schedule.isWorkday ? 'Laboral' : 'No laboral'}
                    </span>
                  </div>

                  {/* Horarios (solo si es día laboral) */}
                  {schedule.isWorkday && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Inicio:</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={schedule.startHour}
                          onChange={(e) => updateSchedule(schedule.dayOfWeek, 'startHour', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={schedule.startMinute || 0}
                          onChange={(e) => updateSchedule(schedule.dayOfWeek, 'startMinute', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                        />
                      </div>

                      <span className="text-gray-400">-</span>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Fin:</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={schedule.endHour}
                          onChange={(e) => updateSchedule(schedule.dayOfWeek, 'endHour', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={schedule.endMinute || 0}
                          onChange={(e) => updateSchedule(schedule.dayOfWeek, 'endMinute', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Errores de validación globales */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-4">
              <ValidationError 
                message="Hay errores de validación. Por favor revisa los campos marcados." 
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={saving || !hasCustomSchedule}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRotateCcw />
              Resetear a Default
            </button>

            <div className="flex gap-3">
              <ModalButtons
                onCancel={onClose}
                onConfirm={handleSave}
                cancelText="Cancelar"
                confirmText="Guardar Horario"
                loading={saving}
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para resetear */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Resetear Horario"
        message="¿Estás seguro de resetear al horario por defecto (Lunes-Viernes 9:00-18:00)? Esta acción eliminará la configuración personalizada."
        confirmText="Sí, resetear"
        cancelText="Cancelar"
        onConfirm={handleResetToDefault}
        onCancel={() => setShowResetConfirm(false)}
        type="warning"
      />
    </Modal>
  );
}
