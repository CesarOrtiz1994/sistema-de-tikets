import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

interface RatingFieldProps {
  id?: string;
  name: string;
  label: string;
  helpText?: string;
  value?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  max?: number;
  className?: string;
}

export default function RatingField({
  id,
  name,
  label,
  helpText,
  value = 0,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  max = 5,
  className = ''
}: RatingFieldProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const handleClick = (rating: number) => {
    if (disabled) return;
    onChange?.(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (disabled) return;
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
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

      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
        onBlur={onBlur}
      >
        {Array.from({ length: max }, (_, index) => {
          const rating = index + 1;
          const isFilled = rating <= (hoverValue || value);

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              disabled={disabled}
              className={`
                p-1 transition-all duration-150 rounded
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
                ${isFilled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
              `}
              aria-label={`${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`}
            >
              <FiStar 
                className={`w-8 h-8 ${isFilled ? 'fill-current' : ''}`}
                strokeWidth={2}
              />
            </button>
          );
        })}
        
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {value} de {max}
          </span>
        )}
      </div>

      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
