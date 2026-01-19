import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import SearchInput from '../components/common/SearchInput';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiBriefcase } from 'react-icons/fi';
import { departmentsService, Department, CreateDepartmentData, UpdateDepartmentData } from '../services/departments.service';
import DepartmentModal from '../components/Departments/DepartmentModal';
import DepartmentUsersModal from '../components/Departments/DepartmentUsersModal';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';

export default function DepartmentsManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();
  const { hasRole } = usePermissions();

  const isSuperAdmin = hasRole(RoleType.SUPER_ADMIN);
  const isDeptAdmin = hasRole(RoleType.DEPT_ADMIN);
  const canManageUsers = isSuperAdmin || isDeptAdmin;

  useEffect(() => {
    loadDepartments();
  }, [currentPage, searchTerm]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsService.getAllDepartments({
        search: searchTerm,
        page: currentPage,
        limit: 10
      });

      setDepartments(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleManageUsers = (department: Department) => {
    setSelectedDepartment(department);
    setIsUsersModalOpen(true);
  };

  const handleSaveDepartment = async (data: CreateDepartmentData | UpdateDepartmentData) => {
    try {
      if (selectedDepartment) {
        await departmentsService.updateDepartment(selectedDepartment.id, data);
        toast.success('Departamento actualizado exitosamente');
      } else {
        await departmentsService.createDepartment(data as CreateDepartmentData);
        toast.success('Departamento creado exitosamente');
      }
      await loadDepartments();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al guardar departamento:', error);
      throw error;
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    const confirmed = await confirm({
      title: 'Eliminar Departamento',
      message: `¿Estás seguro de eliminar el departamento "${department.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    
    if (!confirmed) return;

    try {
      await departmentsService.deleteDepartment(department.id);
      toast.success('Departamento eliminado exitosamente');
      await loadDepartments();
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      toast.error('Error al eliminar el departamento', {
        description: 'Puede que tenga usuarios asignados'
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Departamentos"
        description="Administra los departamentos de la organización"
        action={
          isSuperAdmin ? (
            <button
              onClick={handleCreateDepartment}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <FiPlus />
              <span>Nuevo Departamento</span>
            </button>
          ) : undefined
        }
      />

      <Card>
        <SearchInput
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          placeholder="Buscar departamentos..."
          className="w-full"
        />
      </Card>

      <DataTable
        data={departments}
        columns={[
          {
            key: 'department',
            header: 'Departamento',
            render: (department: Department) => (
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {department.name}
                </div>
                {department.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    {department.description}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'prefix',
            header: 'Prefijo',
            render: (department: Department) => (
              <Badge variant="purple" size="sm">
                {department.prefix}
              </Badge>
            )
          },
          {
            key: 'users',
            header: 'Usuarios',
            render: (department: Department) => (
              <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                <FiUsers className="mr-2 text-gray-400 dark:text-gray-500" />
                {department._count?.departmentUsers || 0}
              </div>
            )
          },
          {
            key: 'status',
            header: 'Estado',
            render: (department: Department) => (
              <Badge variant={department.isDefaultForRequesters ? 'success' : 'gray'} size="sm">
                {department.isDefaultForRequesters ? 'Por defecto' : 'Normal'}
              </Badge>
            )
          },
          {
            key: 'creator',
            header: 'Creado por',
            render: (department: Department) => (
              <div className="text-sm text-gray-500 dark:text-gray-300">
                {department.createdBy?.name || 'Sistema'}
              </div>
            )
          },
          ...(canManageUsers ? [{
            key: 'actions',
            header: 'Acciones',
            align: 'right' as const,
            render: (department: Department) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleManageUsers(department)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Gestionar Usuarios"
                >
                  <FiUsers size={18} />
                </button>
                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => handleEditDepartment(department)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Editar"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            )
          }] : [])
        ]}
        loading={loading}
        emptyMessage="No se encontraron departamentos con los filtros aplicados"
        emptyIcon={<FiBriefcase />}
        getRowKey={(department) => department.id}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

  <DepartmentModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveDepartment}
    department={selectedDepartment}
  />

  {selectedDepartment && (
    <DepartmentUsersModal
      isOpen={isUsersModalOpen}
      onClose={() => setIsUsersModalOpen(false)}
      departmentId={selectedDepartment.id}
      departmentName={selectedDepartment.name}
    />
  )}

  <ConfirmDialog
    isOpen={isOpen}
    title={options.title}
    message={options.message}
    confirmText={options.confirmText}
    cancelText={options.cancelText}
    type={options.type}
    onConfirm={handleConfirm}
    onCancel={handleCancel}
  />
</div>
);
}
