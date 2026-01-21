import { useNavigate } from 'react-router-dom';
import { FiFileText, FiPlus } from 'react-icons/fi';

export default function TicketsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus tickets y solicitudes</p>
        </div>
        <button 
          onClick={() => navigate('/tickets/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
        >
          <FiPlus />
          <span>Nuevo Ticket</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-center py-12">
          <FiFileText className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay tickets</h3>
          <p className="text-gray-500 dark:text-gray-400">Crea tu primer ticket para comenzar</p>
        </div>
      </div>
    </div>
  );
}
