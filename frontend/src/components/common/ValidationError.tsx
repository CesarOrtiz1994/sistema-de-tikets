import { FiAlertCircle } from 'react-icons/fi';

interface ValidationErrorProps {
  message: string;
  className?: string;
}

export default function ValidationError({ message, className = '' }: ValidationErrorProps) {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm mt-1 ${className}`}>
      <FiAlertCircle className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
