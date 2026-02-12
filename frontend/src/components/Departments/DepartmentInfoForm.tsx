import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card from '../common/Card';
import ValidationError from '../common/ValidationError';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiSave, FiAlertCircle } from 'react-icons/fi';
import { departmentInfoSchema, DepartmentInfoFormData } from '../../validators/department.validator';
import { departmentsService, Department } from '../../services/departments.service';
import { z } from 'zod';

interface DepartmentInfoFormProps {
  department: Department;
  onUpdate: () => void;
}

export default function DepartmentInfoForm({ department, onUpdate }: DepartmentInfoFormProps) {
  const [formData, setFormData] = useState<DepartmentInfoFormData>({
    name: '',
    prefix: '',
    description: '',
    isDefaultForRequesters: false,
    requireRating: true,
    autoCloseAfterDays: 8
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        prefix: department.prefix,
        description: department.description || '',
        isDefaultForRequesters: department.isDefaultForRequesters ?? false,
        requireRating: department.requireRating ?? true,
        autoCloseAfterDays: (department as any).autoCloseAfterDays ?? 8
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validar con Zod
      const validatedData = departmentInfoSchema.parse(formData);
      
      console.log('Datos validados a enviar:', validatedData);

      setLoading(true);

      // Enviar datos al backend
      await departmentsService.updateDepartment(department.id, validatedData);

      toast.success('Departamento actualizado exitosamente');
      onUpdate();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Mostrar errores de validación
        const validationErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            validationErrors[err.path[0].toString()] = err.message;
          }
        });
        console.error('Errores de validación:', validationErrors);
        console.error('Datos del formulario:', formData);
        setErrors(validationErrors);
        
        // Mostrar el primer error específico
        const firstError = Object.values(validationErrors)[0];
        toast.error(firstError || 'Por favor corrige los errores en el formulario');
      } else {
        console.error('Error al actualizar:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar departamento';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información General
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configura la información básica de tu departamento
          </p>
        </div>

        {/* Nombre del Departamento */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Departamento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ej: Recursos Humanos"
          />
          <ValidationError message={errors.name} />
        </div>

        {/* Prefijo */}
        <div>
          <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prefijo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="prefix"
            value={formData.prefix}
            onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white uppercase"
            placeholder="Ej: RH"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            El prefijo se usará para identificar tickets (ej: RH-2026-001). Solo letras mayúsculas.
          </p>
          <ValidationError message={errors.prefix} />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Describe las funciones de este departamento..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.description?.length || 0}/500 caracteres
          </p>
          <ValidationError message={errors.description} />
        </div>

        {/* Acceso Público */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="isDefaultForRequesters"
                checked={formData.isDefaultForRequesters}
                onChange={(e) => setFormData({ ...formData, isDefaultForRequesters: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="isDefaultForRequesters" className="font-medium text-gray-700 dark:text-gray-300">
                Permitir acceso público para crear tickets
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cualquier usuario podrá crear tickets en este departamento sin necesidad de asignarle acceso específico
              </p>
              {formData.isDefaultForRequesters && (
                <div className="mt-2 flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                  <span>Solo un departamento puede ser público a la vez. Al activar esto, se desactivará en otros departamentos.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Requerir Calificación */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="requireRating"
                checked={formData.requireRating}
                onChange={(e) => setFormData({ ...formData, requireRating: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="requireRating" className="font-medium text-gray-700 dark:text-gray-300">
                Requerir calificación al cerrar tickets
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Los usuarios deberán calificar el servicio (1-5 estrellas) antes de cerrar un ticket resuelto
              </p>
            </div>
          </div>
        </div>

        {/* Auto-cerrar tickets */}
        <div>
          <label htmlFor="autoCloseAfterDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Auto-cerrar tickets después de (días hábiles)
          </label>
          <input
            type="number"
            id="autoCloseAfterDays"
            value={formData.autoCloseAfterDays}
            onChange={(e) => setFormData({ ...formData, autoCloseAfterDays: parseInt(e.target.value) || 1 })}
            min="1"
            max="90"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Los tickets en estado "Resuelto" se cerrarán automáticamente después de este número de días hábiles (tomando en cuenta el horario laboral del departamento)
          </p>
          <ValidationError message={errors.autoCloseAfterDays} />
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-brand-gradient bg-brand-gradient-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <FiSave />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
