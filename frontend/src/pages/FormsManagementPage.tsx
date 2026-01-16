import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiFileText } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ModalButtons from '../components/ModalButtons';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import { formsService, TicketForm } from '../services/forms.service';
import { departmentsService } from '../services/departments.service';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

export default function FormsManagementPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<TicketForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    loadDepartmentAndForms();
  }, []);

  const loadDepartmentAndForms = async () => {
    try {
      setLoading(true);
      // Obtener el departamento del usuario actual
      const response = await departmentsService.getAllDepartments({ page: 1, limit: 1 });
      
      if (response.data.length > 0) {
        const myDept = response.data[0];
        setDepartmentId(myDept.id);
        await loadForms(myDept.id);
      } else {
        toast.error('No tienes un departamento asignado');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading department:', error);
      toast.error('Error al cargar el departamento');
      setLoading(false);
    }
  };

  const loadForms = async (deptId: string) => {
    try {
      setLoading(true);
      const data = await formsService.getDepartmentForms(deptId);
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error('Error al cargar los formularios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setNewFormName('');
    setNewFormDescription('');
    setIsCreateModalOpen(true);
  };

  const handleCreateForm = async () => {
    if (!newFormName.trim()) {
      toast.error('El nombre del formulario es requerido');
      return;
    }

    if (!departmentId) {
      toast.error('No se pudo obtener el departamento');
      return;
    }

    try {
      const newForm = await formsService.createForm({
        departmentId,
        name: newFormName.trim(),
        description: newFormDescription.trim() || undefined,
        status: 'DRAFT'
      });
      toast.success('Formulario creado exitosamente');
      setIsCreateModalOpen(false);
      navigate(`/dashboard/forms/${newForm.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Error al crear el formulario');
    }
  };

  const handleEditForm = (formId: string) => {
    navigate(`/dashboard/forms/${formId}`);
  };

  const handleDuplicateForm = async (form: TicketForm) => {
    const newName = prompt('Nombre del formulario duplicado:', `${form.name} (Copia)`);
    if (!newName) return;

    try {
      const duplicatedForm = await formsService.duplicateForm(form.id, newName);
      toast.success('Formulario duplicado exitosamente');
      setForms([...forms, duplicatedForm]);
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Error al duplicar el formulario');
    }
  };

  const handleDeleteForm = async (form: TicketForm) => {
    const confirmed = await confirm({
      title: 'Eliminar formulario',
      message: `¿Estás seguro de que deseas eliminar "${form.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await formsService.deleteForm(form.id);
      setForms(forms.filter(f => f.id !== form.id));
      toast.success('Formulario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Error al eliminar el formulario');
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Activo</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Borrador</Badge>;
      case 'ARCHIVED':
        return <Badge variant="danger">Archivado</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formularios de Tickets"
        description="Gestiona los formularios personalizados para la creación de tickets"
        action={
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <FiPlus />
            <span>Nuevo Formulario</span>
          </button>
        }
      />

      <Card>
        <SearchInput
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          placeholder="Buscar formularios..."
          className="w-full"
        />
      </Card>

      <DataTable
        data={filteredForms}
        getRowKey={(form) => form.id}
        columns={[
          {
            key: 'form',
            header: 'Formulario',
            render: (form: TicketForm) => (
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {form.name}
                  </div>
                  {form.isDefault && (
                    <Badge variant="info" size="sm">Predeterminado</Badge>
                  )}
                </div>
                {form.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                    {form.description}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'fields',
            header: 'Campos',
            render: (form: TicketForm) => (
              <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                <FiFileText className="mr-2 text-gray-400 dark:text-gray-500" />
                {form.fields?.length || 0}
              </div>
            )
          },
          {
            key: 'status',
            header: 'Estado',
            render: (form: TicketForm) => getStatusBadge(form.status)
          },
          {
            key: 'actions',
            header: 'Acciones',
            render: (form: TicketForm) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditForm(form.id)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Editar formulario"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicateForm(form)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Duplicar formulario"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteForm(form)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Eliminar formulario"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )
          }
        ]}
        emptyMessage="No se encontraron formularios"
      />

      {/* Modal para crear formulario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Formulario"
        subtitle="Completa la información para crear un nuevo formulario personalizado"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setIsCreateModalOpen(false)}
            onConfirm={handleCreateForm}
            cancelText="Cancelar"
            confirmText="Crear Formulario"
            confirmDisabled={!newFormName.trim()}
            variant="primary"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del formulario *
            </label>
            <input
              type="text"
              value={newFormName}
              onChange={(e) => setNewFormName(e.target.value)}
              placeholder="Ej: Formulario de Soporte Técnico"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={newFormDescription}
              onChange={(e) => setNewFormDescription(e.target.value)}
              placeholder="Descripción del formulario"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>
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
