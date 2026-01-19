import { CheckboxGroupFieldProps } from '../../types/fieldTypes';

export default function CheckboxGroupField({
  id,
  name,
  label,
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
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    
    if (checked) {
      // Agregar valor si no existe
      if (!currentValues.includes(optionValue)) {
        onChange?.([...currentValues, optionValue]);
      }
    } else {
      // Remover valor
      onChange?.(currentValues.filter(v => v !== optionValue));
    }
  };

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
        {options.map((option) => {
          const isChecked = Array.isArray(value) && value.includes(option.value);
          
          return (
            <div key={option.value} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`${id || name}-${option.value}`}
                  name={`${name}[]`}
                  type="checkbox"
                  value={option.value}
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  onBlur={onBlur}
                  disabled={disabled || option.disabled}
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
                  htmlFor={`${id || name}-${option.value}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
