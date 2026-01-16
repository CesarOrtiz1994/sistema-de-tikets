import { useState } from 'react';
import { BaseFieldProps } from '../../types/fieldTypes';

interface ColorFieldProps extends BaseFieldProps {
  format?: 'hex' | 'rgb' | 'hsl';
  showPreview?: boolean;
  presetColors?: string[];
}

export default function ColorField({
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
  showPreview = true,
  presetColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ],
  className = ''
}: ColorFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const currentColor = value || '#000000';

  const handleColorChange = (newColor: string) => {
    onChange?.(newColor);
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

      <div className="flex gap-3 items-start">
        {/* Color Input */}
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              id={id || name}
              name={name}
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              required={required}
              className={`
                w-20 h-10 rounded-lg cursor-pointer border-2
                disabled:cursor-not-allowed disabled:opacity-50
                ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              `}
            />
            
            <input
              type="text"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              placeholder="#000000"
              className={`
                flex-1 px-3 py-2 border rounded-lg font-mono text-sm
                focus:ring-2 focus:ring-purple-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                dark:bg-gray-700 dark:border-gray-600 dark:text-white
                dark:disabled:bg-gray-800
                ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
              `}
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Vista previa
            </span>
          </div>
        )}
      </div>

      {/* Preset Colors */}
      {presetColors && presetColors.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            {showPicker ? 'Ocultar' : 'Mostrar'} colores predefinidos
          </button>
          
          {showPicker && (
            <div className="grid grid-cols-10 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  disabled={disabled}
                  className={`
                    w-8 h-8 rounded-lg border-2 transition-all
                    hover:scale-110 hover:shadow-md
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${currentColor === color 
                      ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
