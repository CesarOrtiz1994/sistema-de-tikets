import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  other?: ReactNode;
}

export default function PageHeader({ title, description, action, other }: PageHeaderProps) {
  console.log('PageHeader', { title, description, action, other })
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}
        {other && <div className='pt-2'> {other}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
