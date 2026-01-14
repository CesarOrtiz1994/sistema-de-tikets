import { FiFileText, FiPlus } from 'react-icons/fi';

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Tickets</h1>
          <p className="text-gray-600 mt-1">Gestiona tus tickets y solicitudes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
          <FiPlus />
          <span>Nuevo Ticket</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="text-center py-12">
          <FiFileText className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay tickets</h3>
          <p className="text-gray-500">Crea tu primer ticket para comenzar</p>
        </div>
      </div>
    </div>
  );
}
