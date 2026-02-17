import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiArrowLeft, FiSave, FiEye, FiCopy, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ModalButtons from '../components/common/ModalButtons';
import FormBuilder from '../components/FormBuilder/FormBuilder';
import DynamicFormRenderer from '../components/DynamicForm/DynamicFormRenderer';
import { formsService, TicketForm, UpdateFormData } from '../services/forms.service';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketForm | null>(null);
  
  usePageTitle(form ? `Formulario: ${form.name}` : 'Constructor de Formularios');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [duplicateFormName, setDuplicateFormName] = useState('');
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    if (!formId) return;
    
    try {
      setLoading(true);
      const data = await formsService.getFormById(formId);
      setForm(data);
      setFormName(data.name);
      setFormDescription(data.description || '');
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Error al cargar el formulario');
      navigate('/dashboard/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formId || !form) return;

    try {
      setSaving(true);
      const updateData: UpdateFormData = {
        name: formName,
        description: formDescription
      };

      const updatedForm = await formsService.updateForm(formId, updateData);
      setForm(updatedForm);
      toast.success('Formulario guardado exitosamente');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Error al guardar el formulario');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formId || !form) return;

    const confirmed = await confirm({
      title: 'Publicar formulario',
      message: '¿Estás seguro de que deseas publicar este formulario? Los usuarios podrán usarlo para crear tickets.',
      confirmText: 'Publicar',
      type: 'info'
    });

    if (!confirmed) return;

    try {
      const updatedForm = await formsService.updateForm(formId, { status: 'ACTIVE' });
      setForm(updatedForm);
      toast.success('Formulario publicado exitosamente');
    } catch (error) {
      console.error('Error publishing form:', error);
      toast.error('Error al publicar el formulario');
    }
  };

  const handleOpenDuplicateModal = () => {
    if (!form) return;
    setDuplicateFormName(`${form.name} (Copia)`);
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (!formId || !duplicateFormName.trim()) {
      toast.error('El nombre del formulario es requerido');
      return;
    }

    try {
      const duplicatedForm = await formsService.duplicateForm(formId, duplicateFormName.trim());
      toast.success('Formulario duplicado exitosamente');
      setIsDuplicateModalOpen(false);
      navigate(`/dashboard/forms/${duplicatedForm.id}`);
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Error al duplicar el formulario');
    }
  };

  const handleDelete = async () => {
    if (!formId || !form) return;

    const confirmed = await confirm({
      title: 'Eliminar formulario',
      message: '¿Estás seguro de que deseas eliminar este formulario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await formsService.deleteForm(formId);
      toast.success('Formulario eliminado exitosamente');
      navigate('/dashboard/forms');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Error al eliminar el formulario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!form || !formId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Constructor de Formularios"
        description="Diseña y personaliza formularios para la creación de tickets"
      />

      <Card>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/forms')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Volver a formularios</span>
            </button>

            <div className="flex items-center gap-3">
              <Badge variant={
                form.status === 'ACTIVE' ? 'success' :
                form.status === 'DRAFT' ? 'warning' : 'danger'
              }>
                {form.status === 'ACTIVE' ? 'Activo' : form.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
              </Badge>

              <button
                onClick={handleOpenDuplicateModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiCopy className="w-4 h-4" />
                Duplicar
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Eliminar
              </button>

              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" />
                Vista Previa
              </button>

              {form.status === 'DRAFT' && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Borrador'}
                  </button>

                  <button
                    onClick={handlePublish}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    Publicar
                  </button>
                </>
              )}

              {form.status === 'ACTIVE' && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-brand-gradient bg-brand-gradient-hover text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del formulario
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Formulario de Soporte Técnico"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Descripción opcional del formulario"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <FormBuilder formId={formId} />
        </div>
      </Card>

      {/* Modal para duplicar formulario */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setDuplicateFormName('');
        }}
        title="Duplicar Formulario"
        subtitle={form ? `Crear una copia de "${form.name}"` : ''}
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              setIsDuplicateModalOpen(false);
              setDuplicateFormName('');
            }}
            onConfirm={handleDuplicate}
            cancelText="Cancelar"
            confirmText="Duplicar"
            confirmIcon={<FiCopy />}
            confirmDisabled={!duplicateFormName.trim()}
            variant="primary"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del formulario duplicado *
            </label>
            <input
              type="text"
              value={duplicateFormName}
              onChange={(e) => setDuplicateFormName(e.target.value)}
              placeholder="Ej: Formulario de Soporte (Copia)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Vista Previa */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Vista Previa del Formulario"
        size="xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {form && (
            <DynamicFormRenderer
              form={form}
              onSubmit={(values) => {
                console.log('Preview form values:', values);
                toast.success('Vista previa - Formulario válido');
                setIsPreviewModalOpen(false);
              }}
              submitButtonText="Probar Envío"
              showProgress={true}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        {...options}
      />
    </div>
  );
}
