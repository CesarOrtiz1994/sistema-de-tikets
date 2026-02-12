import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import { FiUserPlus, FiTrash2 } from 'react-icons/fi';
import { departmentsService, DepartmentUser } from '../../services/departments.service';
import { usersService } from '../../services/users.service';
import AssignUserModal from '../Users/AssignUserModal';

interface DepartmentUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  departmentId: string;
  departmentName: string;
}

export default function DepartmentUsersModal({ isOpen, onClose, onSuccess, departmentId, departmentName }: DepartmentUsersModalProps) {
  const [users, setUsers] = useState<DepartmentUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const { isOpen: confirmIsOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadAvailableUsers();
    }
  }, [isOpen, departmentId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await departmentsService.getDepartmentUsers(departmentId);
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersService.listUsers({ page: 1, limit: 100 });
      const assignedUserIds = users.map(u => u.userId);
      // Filtrar usuarios ya asignados Y excluir SUPER_ADMIN
      const available = response.users.filter(
        (user: any) => !assignedUserIds.includes(user.id) && user.roleType !== 'SUPER_ADMIN'
      );
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    }
  };

  const handleAssignUser = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      await departmentsService.assignUserToDepartment(departmentId, userId, role);
      toast.success('Usuario asignado al departamento exitosamente');
      await loadUsers();
      await loadAvailableUsers();
      setIsAssignModalOpen(false);
      onSuccess?.(); // Notificar a la página principal para recargar
    } catch (error) {
      console.error('Error al asignar usuario:', error);
      throw error;
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Remover Usuario',
      message: '¿Estás seguro de remover este usuario del departamento?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    
    if (!confirmed) return;

    try {
      await departmentsService.removeUserFromDepartment(departmentId, userId);
      toast.success('Usuario removido del departamento exitosamente');
      await loadUsers();
      await loadAvailableUsers();
      onSuccess?.(); // Notificar a la página principal para recargar
    } catch (error) {
      console.error('Error al remover usuario:', error);
      toast.error('Error al remover usuario del departamento');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Usuarios del Departamento"
        subtitle={departmentName}
        size="lg"
        footer={
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        }
      >
        <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Usuarios Asignados ({users.length})
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-brand-gradient bg-brand-gradient-hover text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <FiUserPlus />
                Asignar Usuario
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay usuarios asignados a este departamento
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((departmentUser) => (
                  <div
                    key={departmentUser.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        {departmentUser.user.profilePicture ? (
                          <img
                            src={departmentUser.user.profilePicture}
                            alt={departmentUser.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-purple-600 dark:text-purple-300 font-semibold">
                            {departmentUser.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {departmentUser.user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {departmentUser.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          departmentUser.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {departmentUser.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                      </span>
                      <button
                        onClick={() => handleRemoveUser(departmentUser.userId)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2"
                        title="Remover usuario"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </Modal>

      <AssignUserModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignUser}
        availableUsers={availableUsers}
      />

      <ConfirmDialog
        isOpen={confirmIsOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
