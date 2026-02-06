import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import type { MessageReceived } from '../../validators/socket.validator';

interface ChatSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  results: MessageReceived[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isSearching: boolean;
}

export default function ChatSearch({
  onSearch,
  onClear,
  results,
  currentIndex,
  onNavigate,
  isSearching
}: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      onSearch(value.trim());
    } else if (value.trim().length === 0) {
      onClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const handleClose = () => {
    setIsOpen(false);
    handleClear();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Buscar en mensajes"
      >
        <FiSearch className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 shadow-sm">
      <FiSearch className="w-4 h-4 text-gray-400" />
      
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar mensajes..."
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none min-w-[200px]"
      />

      {isSearching && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
      )}

      {results.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {currentIndex + 1} de {results.length}
          </span>
          
          <div className="flex gap-1">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Anterior"
            >
              <FiChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === results.length - 1}
              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Siguiente"
            >
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {query && (
        <button
          onClick={handleClear}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Limpiar búsqueda"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={handleClose}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Cerrar búsqueda"
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  );
}
