import { ReactNode } from 'react';
import { IconType } from 'react-icons';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
      <Icon className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
