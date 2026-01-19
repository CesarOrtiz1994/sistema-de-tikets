import { CheckboxFieldProps } from '../../types/fieldTypes';

export default function ToggleField({
  id,
  name,
  label,
  helpText,
  checked,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = ''
}: CheckboxFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label 
            htmlFor={id || name} 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {helpText && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>
          )}
        </div>
        
        <button
          type="button"
          role="switch"
          aria-checked={checked || false}
          onClick={() => !disabled && onChange?.(!checked)}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            dark:focus:ring-offset-gray-800
            ${checked 
              ? 'bg-purple-600' 
              : 'bg-gray-200 dark:bg-gray-700'
            }
          `}
        >
          <span className="sr-only">{label}</span>
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full
              bg-white shadow-lg ring-0
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
