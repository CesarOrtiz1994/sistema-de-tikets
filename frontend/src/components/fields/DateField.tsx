import { DateFieldProps } from '../../types/fieldTypes';

export default function DateField({
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
  type = 'date',
  minDate,
  maxDate,
  className = ''
}: DateFieldProps) {
  const inputType = type === 'datetime' ? 'datetime-local' : type;
  
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (type === 'date') {
      return d.toISOString().split('T')[0];
    } else if (type === 'datetime') {
      return d.toISOString().slice(0, 16);
    } else if (type === 'time') {
      return d.toISOString().slice(11, 16);
    }
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={id || name}
        name={name}
        type={inputType}
        value={formatDateForInput(value)}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={minDate ? formatDateForInput(minDate) : undefined}
        max={maxDate ? formatDateForInput(maxDate) : undefined}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:ring-2 focus:ring-purple-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          dark:disabled:bg-gray-800
          ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
        `}
      />
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
