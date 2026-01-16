import { CheckboxFieldProps } from '../../types/fieldTypes';

export default function CheckboxField({
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
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id || name}
            name={name}
            type="checkbox"
            checked={checked || false}
            onChange={(e) => onChange?.(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`
              w-4 h-4 rounded
              text-purple-600 
              focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              dark:bg-gray-700 dark:border-gray-600
              dark:focus:ring-offset-gray-800
              ${error ? 'border-red-500' : 'border-gray-300'}
            `}
          />
        </div>
        <div className="ml-3">
          <label 
            htmlFor={id || name} 
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {helpText && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 ml-7">{error}</p>
      )}
    </div>
  );
}
