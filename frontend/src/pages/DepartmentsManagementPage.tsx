import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUsers, FiBriefcase } from 'react-icons/fi';
import { departmentsService, Department, CreateDepartmentData, UpdateDepartmentData } from '../services/departments.service';
import DepartmentModal from '../components/DepartmentModal';
import DepartmentUsersModal from '../components/DepartmentUsersModal';
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
  const [selectedDepartmentForUsers, setSelectedDepartmentForUsers] = useState<Department | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
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
      } else {
        await departmentsService.createDepartment(data as CreateDepartmentData);
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
      await loadDepartments();
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      toast.error('Error al eliminar el departamento', {
        description: 'Puede que tenga usuarios asignados'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Gestión de Departamentos</h1>
          <p className="text-gray-600 dark:text-gray-300">Administra los departamentos de la organización</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={handleCreateDepartment}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <FiPlus />
            <span>Nuevo Departamento</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar departamentos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

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
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                {department.prefix}
              </span>
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
              department.isDefaultForRequesters ? (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Por defecto
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Normal
                </span>
              )
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
