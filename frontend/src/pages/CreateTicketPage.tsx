import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DynamicFormRenderer from '../components/DynamicForm/DynamicFormRenderer';
import { departmentsService, Department } from '../services/departments.service';
import { formsService, TicketForm } from '../services/forms.service';
import { ticketsService, TicketPriority } from '../services/tickets.service';
import { createTicketSchema } from '../validators/tickets.validator';

const PRIORITY_OPTIONS: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Baja', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'MEDIUM', label: 'Media', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800 border-red-300' },
];

export default function CreateTicketPage() {
  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [activeForm, setActiveForm] = useState<TicketForm | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar departamentos disponibles
  useEffect(() => {
    loadDepartments();
  }, []);

  // Cargar formulario activo cuando se selecciona un departamento
  useEffect(() => {
    if (selectedDepartmentId) {
      loadActiveForm(selectedDepartmentId);
    } else {
      setActiveForm(null);
    }
  }, [selectedDepartmentId]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      // Cargar solo departamentos accesibles para el usuario
      const response = await departmentsService.getAccessibleDepartments();
      setDepartments(response || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Error al cargar departamentos');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadActiveForm = async (departmentId: string) => {
    try {
      setLoadingForm(true);
      const form = await formsService.getActiveDepartmentForm(departmentId);
      setActiveForm(form);
    } catch (error: any) {
      console.error('Error loading form:', error);
      const message = error.response?.data?.message || 'No hay formulario activo para este departamento';
      toast.error(message);
      setActiveForm(null);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!selectedDepartmentId || !activeForm) {
      toast.error('Selecciona un departamento primero');
      return;
    }

    if (!title.trim()) {
      toast.error('Ingresa un título para el ticket');
      return;
    }

    try {
      setIsSubmitting(true);

      // Validar con Zod
      const ticketData = createTicketSchema.parse({
        departmentId: selectedDepartmentId,
        formId: activeForm.id,
        title: title.trim(),
        priority,
        formData
      });

      // Crear ticket
      const createdTicket = await ticketsService.createTicket(ticketData);

      toast.success(
        `¡Ticket ${createdTicket.ticketNumber} creado exitosamente!`,
        {
          description: 'Serás redirigido a la vista del ticket'
        }
      );

      // Redirect a la vista del ticket
      setTimeout(() => {
        navigate(`/tickets/${createdTicket.id}`);
      }, 1500);

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      
      if (error.errors) {
        // Errores de validación de Zod
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        const message = error.response?.data?.message || 'Error al crear el ticket';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDepartments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crear Nuevo Ticket"
        description="Completa el formulario para crear una solicitud"
        action={
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiArrowLeft />
            <span>Volver</span>
          </button>
        }
      />

      {/* Selección de departamento */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departamento <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Selecciona un departamento</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selecciona el departamento al que deseas enviar tu solicitud
            </p>
          </div>

          {selectedDepartmentId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título del Ticket <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ej: Solicitud de equipo de cómputo"
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Describe brevemente tu solicitud ({title.length}/200)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridad <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      disabled={isSubmitting}
                      className={`
                        px-4 py-3 rounded-lg border-2 font-medium transition-all
                        ${priority === option.value
                          ? `${option.color} border-current shadow-md scale-105`
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Formulario dinámico */}
      {selectedDepartmentId && (
        <>
          {loadingForm ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Cargando formulario...
                </span>
              </div>
            </Card>
          ) : activeForm ? (
            <DynamicFormRenderer
              form={activeForm}
              onSubmit={handleFormSubmit}
              submitButtonText={isSubmitting ? 'Creando ticket...' : 'Crear Ticket'}
              showProgress={true}
            />
          ) : (
            <Card>
              <div className="text-center py-12">
                <FiAlertCircle className="mx-auto text-5xl text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No hay formulario disponible
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Este departamento no tiene un formulario activo configurado.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Por favor contacta al administrador del departamento.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {!selectedDepartmentId && (
        <Card>
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Selecciona un departamento
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Para comenzar, selecciona el departamento al que deseas enviar tu solicitud
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
