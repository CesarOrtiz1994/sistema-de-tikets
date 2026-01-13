import { FiFileText, FiUsers, FiBarChart2, FiBell } from 'react-icons/fi';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema de Tickets
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de gestión de tickets con formularios dinámicos
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Características principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-blue-50 rounded-lg">
              <FiFileText className="text-3xl text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Formularios Dinámicos</h3>
              <p className="text-sm text-gray-600">Crea formularios personalizados con drag & drop</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <FiUsers className="text-3xl text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Gestión de Equipos</h3>
              <p className="text-sm text-gray-600">Organiza departamentos y usuarios</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <FiBarChart2 className="text-3xl text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Métricas en Tiempo Real</h3>
              <p className="text-sm text-gray-600">Dashboards y reportes detallados</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <FiBell className="text-3xl text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Notificaciones</h3>
              <p className="text-sm text-gray-600">Email, push y notificaciones en tiempo real</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold">
            Iniciar Sesión con Google
          </button>
          <button className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold">
            Ver Demo
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Desarrollado con React + TypeScript + Tailwind CSS
        </p>
      </div>
    </div>
  );
}
