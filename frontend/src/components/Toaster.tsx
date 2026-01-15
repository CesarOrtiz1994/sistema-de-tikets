import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../hooks/useTheme';

export default function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      duration={5000}
      expand={true}
      toastOptions={{
        style: {
          padding: '20px',
          fontSize: '15px',
          fontWeight: '600',
          borderRadius: '12px',
          minHeight: '70px',
          boxShadow: theme === 'dark' 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.5)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        },
        classNames: {
          error: theme === 'dark'
            ? 'bg-gradient-to-r from-red-900 to-red-800 border-2 border-red-500 text-red-50'
            : 'bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-700 text-white',
          success: theme === 'dark'
            ? 'bg-gradient-to-r from-green-900 to-green-800 border-2 border-green-500 text-green-50'
            : 'bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-700 text-white',
          warning: theme === 'dark'
            ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 border-2 border-yellow-500 text-yellow-50'
            : 'bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-700 text-white',
          info: theme === 'dark'
            ? 'bg-gradient-to-r from-blue-900 to-blue-800 border-2 border-blue-500 text-blue-50'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-700 text-white',
        },
      }}
    />
  );
}
