import { TextAreaFieldProps } from '../../types/fieldTypes';

export default function TextAreaField({
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
  rows = 4,
  maxLength,
  minLength,
  className = ''
}: TextAreaFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={id || name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        minLength={minLength}
        className={`
          w-full px-3 py-2 border rounded-lg resize-y
          focus:ring-2 focus:ring-purple-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          dark:disabled:bg-gray-800
          ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
        `}
      />
      
      {maxLength && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{helpText}</span>
          <span>{(value?.length || 0)}/{maxLength}</span>
        </div>
      )}
      
      {!maxLength && helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
