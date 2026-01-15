import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
    />
  );
}
