import { useRef, useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

interface SignatureFieldProps {
  id?: string;
  name: string;
  label: string;
  helpText?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function SignatureField({
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
  className = ''
}: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Cargar firma existente si hay valor
    if (value && isEmpty) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value, isEmpty]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Guardar firma como base64
    const dataUrl = canvas.toDataURL('image/png');
    onChange?.(dataUrl);
    onBlur?.();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.('');
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

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`
            w-full border-2 rounded-lg bg-white cursor-crosshair
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
          style={{ touchAction: 'none' }}
        />

        {!disabled && !isEmpty && (
          <button
            type="button"
            onClick={clearSignature}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
          >
            <FiTrash2 className="w-4 h-4" />
            Limpiar
          </button>
        )}

        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Dibuja tu firma aquí</p>
          </div>
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
