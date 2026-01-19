import { FiCheckCircle } from 'react-icons/fi';

interface FormProgressProps {
  progress: number;
  totalFields: number;
  filledFields: number;
}

export default function FormProgress({ progress, totalFields, filledFields }: FormProgressProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FiCheckCircle className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso del formulario
          </span>
        </div>
        <span className="text-sm font-semibold text-blue-600">
          {progress}%
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {filledFields} de {totalFields} campos completados
      </p>
    </div>
  );
}
