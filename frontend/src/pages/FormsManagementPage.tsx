import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiFileText, FiClock } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ModalButtons from '../components/common/ModalButtons';
import DataTable from '../components/common/DataTable';
import SearchInput from '../components/common/SearchInput';
import { formsService, TicketForm } from '../services/forms.service';
import { departmentsService, Department } from '../services/departments.service';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';

export default function FormsManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<TicketForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [newFormDepartmentId, setNewFormDepartmentId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<TicketForm | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateFormName, setDuplicateFormName] = useState('');
  const [formToDuplicate, setFormToDuplicate] = useState<TicketForm | null>(null);
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';

  useEffect(() => {
    loadDepartmentAndForms();
  }, []);

  const loadDepartmentAndForms = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        // Super Admin: cargar todos los departamentos
        const response = await departmentsService.getAllDepartments({ isActive: true });
        setDepartments(response.data || []);
        
        if (response.data.length > 0) {
          const firstDept = response.data[0];
          setDepartmentId(firstDept.id);
          setNewFormDepartmentId(firstDept.id);
          await loadAllForms();
        } else {
          toast.error('No hay departamentos disponibles');
          setLoading(false);
        }
      } else {
        // Admin de Departamento: cargar solo su departamento
        const response = await departmentsService.getAllDepartments({ page: 1, limit: 1 });
        
        if (response.data.length > 0) {
          const myDept = response.data[0];
          setDepartmentId(myDept.id);
          setNewFormDepartmentId(myDept.id);
          setDepartments([myDept]);
          await loadForms(myDept.id);
        } else {
          toast.error('No tienes un departamento asignado');
          setLoading(false);
        }
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

  const loadAllForms = async () => {
    try {
      setLoading(true);
      const allForms: TicketForm[] = [];
      
      for (const dept of departments) {
        try {
          const data = await formsService.getDepartmentForms(dept.id);
          allForms.push(...data);
        } catch (error) {
          console.error(`Error loading forms for department ${dept.name}:`, error);
        }
      }
      
      setForms(allForms);
    } catch (error) {
      console.error('Error loading all forms:', error);
      toast.error('Error al cargar los formularios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setNewFormName('');
    setNewFormDescription('');
    if (!isSuperAdmin) {
      setNewFormDepartmentId(departmentId);
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateForm = async () => {
    if (!newFormName.trim()) {
      toast.error('El nombre del formulario es requerido');
      return;
    }

    if (!newFormDepartmentId) {
      toast.error('Selecciona un departamento');
      return;
    }

    try {
      const newForm = await formsService.createForm({
        departmentId: newFormDepartmentId,
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

  const handleOpenDuplicateModal = (form: TicketForm) => {
    setFormToDuplicate(form);
    setDuplicateFormName(`${form.name} (Copia)`);
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicateForm = async () => {
    if (!duplicateFormName.trim() || !formToDuplicate) {
      toast.error('El nombre del formulario es requerido');
      return;
    }

    try {
      const duplicatedForm = await formsService.duplicateForm(formToDuplicate.id, duplicateFormName.trim());
      toast.success('Formulario duplicado exitosamente');
      setForms([...forms, duplicatedForm]);
      setIsDuplicateModalOpen(false);
      setFormToDuplicate(null);
      setDuplicateFormName('');
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

  const handleViewVersionHistory = (form: TicketForm) => {
    setSelectedForm(form);
    setIsVersionHistoryOpen(true);
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

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartmentFilter === 'all' || 
      form.departmentId === selectedDepartmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Desconocido';
  };

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
        <div className="space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Buscar formularios..."
            className="w-full"
          />
          
          {isSuperAdmin && departments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por departamento
              </label>
              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los departamentos</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      <DataTable
        data={filteredForms}
        getRowKey={(form) => form.id}
        columns={[
          ...(isSuperAdmin ? [{
            key: 'department',
            header: 'Departamento',
            render: (form: TicketForm) => (
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {getDepartmentName(form.departmentId)}
              </div>
            )
          }] : []),
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
            key: 'version',
            header: 'Versión',
            render: (form: TicketForm) => (
              <div className="text-sm text-gray-900 dark:text-gray-100">
                v{form.version || 1}
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
                  onClick={() => handleOpenDuplicateModal(form)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Duplicar formulario"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewVersionHistory(form)}
                  className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                  title="Ver historial de versiones"
                >
                  <FiClock className="w-4 h-4" />
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
            confirmDisabled={!newFormName.trim() || !newFormDepartmentId}
            variant="primary"
          />
        }
      >
        <div className="space-y-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento *
              </label>
              <select
                value={newFormDepartmentId}
                onChange={(e) => setNewFormDepartmentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecciona un departamento</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              autoFocus={!isSuperAdmin}
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

      {/* Modal para duplicar formulario */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setFormToDuplicate(null);
          setDuplicateFormName('');
        }}
        title="Duplicar Formulario"
        subtitle={formToDuplicate ? `Crear una copia de "${formToDuplicate.name}"` : ''}
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              setIsDuplicateModalOpen(false);
              setFormToDuplicate(null);
              setDuplicateFormName('');
            }}
            onConfirm={handleDuplicateForm}
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
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Se duplicarán todos los campos y configuraciones del formulario original.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal de historial de versiones */}
      <Modal
        isOpen={isVersionHistoryOpen}
        onClose={() => {
          setIsVersionHistoryOpen(false);
          setSelectedForm(null);
        }}
        title="Historial de Versiones"
        subtitle={selectedForm ? `Formulario: ${selectedForm.name}` : ''}
        size="md"
      >
        <div className="space-y-4">
          {selectedForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                    v{selectedForm.version || 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Versión actual
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getStatusBadge(selectedForm.status)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedForm.fields?.length || 0} campos
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedForm.updatedAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  <FiClock className="inline mr-2" />
                  El historial completo de versiones estará disponible en una futura actualización.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
                  Por ahora, puedes ver la versión actual del formulario.
                </p>
              </div>
            </div>
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
