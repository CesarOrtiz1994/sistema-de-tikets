import { toast } from 'sonner';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      toast(options.title, {
        description: options.description,
        duration: 10000,
        action: {
          label: options.confirmText || 'Confirmar',
          onClick: () => resolve(true),
        },
        cancel: {
          label: options.cancelText || 'Cancelar',
          onClick: () => resolve(false),
        },
      });
    });
  };

  return { confirm };
};
