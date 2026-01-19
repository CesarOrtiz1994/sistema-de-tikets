import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noBorder?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  noBorder = false 
}: CardProps) {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors ${
        !noBorder ? 'border border-gray-200 dark:border-gray-700' : ''
      } ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
