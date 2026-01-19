interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'border-purple-600',
  text = 'Cargando...',
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${color}`}></div>
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center py-12">
      {spinner}
    </div>
  );
}
