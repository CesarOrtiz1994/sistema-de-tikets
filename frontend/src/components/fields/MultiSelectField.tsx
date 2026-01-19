import { useState, useRef, useEffect } from 'react';
import { CheckboxGroupFieldProps } from '../../types/fieldTypes';

export default function MultiSelectField({
  id,
  name,
  label,
  placeholder = 'Seleccionar opciones...',
  helpText,
  value = [],
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  options,
  className = ''
}: CheckboxGroupFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedCount = selectedValues.length;

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange?.(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange?.([...selectedValues, optionValue]);
    }
  };

  const getDisplayText = () => {
    if (selectedCount === 0) return placeholder;
    if (selectedCount === 1) {
      const selected = options.find(opt => opt.value === selectedValues[0]);
      return selected?.label || placeholder;
    }
    return `${selectedCount} opciones seleccionadas`;
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-left border rounded-lg
            flex items-center justify-between
            focus:ring-2 focus:ring-purple-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-white
            dark:disabled:bg-gray-800
            ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${selectedCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
          `}
        >
          <span className="truncate">{getDisplayText()}</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {options.map((option) => {
                const isChecked = selectedValues.includes(option.value);
                
                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-center px-3 py-2 cursor-pointer
                      hover:bg-gray-100 dark:hover:bg-gray-600
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => !option.disabled && handleToggle(option.value)}
                      disabled={option.disabled}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
