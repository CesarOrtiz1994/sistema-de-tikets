import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { FiUsers, FiUserPlus, FiTrash2, FiInfo } from 'react-icons/fi';
import { departmentsService, Department, DepartmentUser } from '../services/departments.service';
import { usersService } from '../services/users.service';
import AssignUserModal from '../components/AssignUserModal';

export default function MyDepartmentPage() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<DepartmentUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    loadMyDepartment();
  }, []);

  const loadMyDepartment = async () => {
    try {
      setLoading(true);
      // Obtener el departamento del DEPT_ADMIN (el backend ya filtra)
      const response = await departmentsService.getAllDepartments({ page: 1, limit: 1 });
      
      if (response.data.length > 0) {
        const myDept = response.data[0];
        setDepartment(myDept);
        await loadUsers(myDept.id);
      }
    } catch (error) {
      console.error('Error al cargar departamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (departmentId: string) => {
    try {
      const response = await departmentsService.getDepartmentUsers(departmentId);
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersService.listUsers({ page: 1, limit: 100 });
      const assignedUserIds = users.map(u => u.userId);
      const available = response.users.filter((user: any) => !assignedUserIds.includes(user.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    }
  };

  const handleAssignUser = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    if (!department) return;

    try {
      await departmentsService.assignUserToDepartment(department.id, userId, role);
      await loadUsers(department.id);
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error('Error al asignar usuario:', error);
      alert('Error al asignar usuario. Puede que ya pertenezca a otro departamento.');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!department) return;
    
    const confirmed = await confirm({
      title: 'Remover Usuario',
      message: '¿Estás seguro de remover este usuario del departamento?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    
    if (!confirmed) return;

    try {
      await departmentsService.removeUserFromDepartment(department.id, userId);
      await loadUsers(department.id);
    } catch (error) {
      console.error('Error al remover usuario:', error);
      alert('Error al remover usuario del departamento');
    }
  };

  const handleOpenAssignModal = () => {
    loadAvailableUsers();
    setIsAssignModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
          <FiInfo className="mx-auto text-yellow-600 mb-3" size={48} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-yellow-100 mb-2">No tienes un departamento asignado</h2>
          <p className="text-gray-600 dark:text-yellow-200">
            Contacta al administrador del sistema para que te asigne como administrador de un departamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Mi Departamento</h1>
        <p className="text-gray-600 dark:text-gray-300">Gestiona los miembros de tu departamento</p>
      </div>

      {/* Información del Departamento */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{department.name}</h2>
            {department.description && (
              <p className="text-purple-100 mb-3">{department.description}</p>
            )}
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                Prefijo: {department.prefix}
              </span>
              <span className="flex items-center gap-2">
                <FiUsers />
                {users.length} {users.length === 1 ? 'miembro' : 'miembros'}
              </span>
            </div>
          </div>
          <button
            onClick={handleOpenAssignModal}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 font-semibold"
          >
            <FiUserPlus />
            Agregar Miembro
          </button>
        </div>
      </div>

      {/* Lista de Miembros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Miembros del Departamento</h3>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <FiUsers className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={48} />
            <p className="text-lg font-medium mb-2">No hay miembros asignados</p>
            <p className="text-sm">Haz clic en "Agregar Miembro" para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((departmentUser) => (
              <div
                key={departmentUser.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      {departmentUser.user.profilePicture ? (
                        <img
                          src={departmentUser.user.profilePicture}
                          alt={departmentUser.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-purple-600 dark:text-purple-300 font-bold text-lg">
                          {departmentUser.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info del Usuario */}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-lg">
                        {departmentUser.user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {departmentUser.user.email}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Rol del sistema: {departmentUser.user.roleType}
                      </div>
                    </div>
                  </div>

                  {/* Rol y Acciones */}
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-2 text-sm font-semibold rounded-full ${
                        departmentUser.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {departmentUser.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(departmentUser.userId)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remover del departamento"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AssignUserModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignUser}
        availableUsers={availableUsers}
      />

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
