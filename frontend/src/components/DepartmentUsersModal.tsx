import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { FiX, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import { departmentsService, DepartmentUser } from '../services/departments.service';
import { usersService } from '../services/users.service';
import AssignUserModal from './AssignUserModal';

interface DepartmentUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

export default function DepartmentUsersModal({ isOpen, onClose, departmentId, departmentName }: DepartmentUsersModalProps) {
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
      const available = response.users.filter((user: any) => !assignedUserIds.includes(user.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    }
  };

  const handleAssignUser = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      await departmentsService.assignUserToDepartment(departmentId, userId, role);
      await loadUsers();
      await loadAvailableUsers();
      setIsAssignModalOpen(false);
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
      await loadUsers();
      await loadAvailableUsers();
    } catch (error) {
      console.error('Error al remover usuario:', error);
      toast.error('Error al remover usuario del departamento');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Usuarios del Departamento</h2>
              <p className="text-sm text-gray-600 mt-1">{departmentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Usuarios Asignados ({users.length})
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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
              <div className="text-center py-8 text-gray-500">
                No hay usuarios asignados a este departamento
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((departmentUser) => (
                  <div
                    key={departmentUser.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        {departmentUser.user.profilePicture ? (
                          <img
                            src={departmentUser.user.profilePicture}
                            alt={departmentUser.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-purple-600 font-semibold">
                            {departmentUser.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {departmentUser.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {departmentUser.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          departmentUser.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {departmentUser.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                      </span>
                      <button
                        onClick={() => handleRemoveUser(departmentUser.userId)}
                        className="text-red-600 hover:text-red-900 p-2"
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

          <div className="flex justify-end p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

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
