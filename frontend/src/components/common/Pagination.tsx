interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-b-lg">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
