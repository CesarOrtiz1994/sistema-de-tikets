import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiArrowLeft } from 'react-icons/fi';
import DynamicFormRenderer from '../components/DynamicForm/DynamicFormRenderer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import { formsService, TicketForm } from '../services/forms.service';

export default function DynamicFormTestPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveForm();
  }, [departmentId]);

  const loadActiveForm = async () => {
    if (!departmentId) {
      setError('ID de departamento no proporcionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const activeForm = await formsService.getActiveDepartmentForm(departmentId);
      setForm(activeForm);
    } catch (err: any) {
      console.error('Error loading active form:', err);
      const errorMessage = err.response?.data?.message || 'Error al cargar el formulario';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    toast.success('Formulario enviado exitosamente');
    
    console.log(values)
    
    // Redirigir después de enviar
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Error"
          description={error}
        />
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <FiArrowLeft />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Formulario no encontrado"
          description="No se encontró un formulario activo para este departamento"
        />
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <FiArrowLeft />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
        >
          <FiArrowLeft />
          Volver
        </button>
      </div>

      <DynamicFormRenderer
        form={form}
        onSubmit={handleSubmit}
        submitButtonText="Crear Ticket"
        showProgress={true}
      />
    </div>
  );
}
