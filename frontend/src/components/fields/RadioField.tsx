import { RadioFieldProps } from '../../types/fieldTypes';

export default function RadioField({
  id,
  name,
  label,
  helpText,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  options,
  className = ''
}: RadioFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      <div 
        className={`
          grid gap-2
          ${options.length > 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}
        `}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={`${id || name}-${option.value}`}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                onBlur={onBlur}
                disabled={disabled || option.disabled}
                required={required}
                className={`
                  w-4 h-4
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
                htmlFor={`${id || name}-${option.value}`}
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
