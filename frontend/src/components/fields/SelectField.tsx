import { SelectFieldProps } from '../../types/fieldTypes';

export default function SelectField({
  id,
  name,
  label,
  placeholder,
  helpText,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  options,
  multiple = false,
  className = ''
}: SelectFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={id || name}
        name={name}
        value={value || (multiple ? [] : '')}
        onChange={(e) => {
          if (multiple) {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            onChange?.(selected);
          } else {
            onChange?.(e.target.value);
          }
        }}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        multiple={multiple}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:ring-2 focus:ring-purple-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          dark:disabled:bg-gray-800
          ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        {!multiple && placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
