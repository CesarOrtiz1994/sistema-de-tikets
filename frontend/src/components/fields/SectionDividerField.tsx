import React from 'react';

interface SectionDividerFieldProps {
  label?: string;
}

const SectionDividerField: React.FC<SectionDividerFieldProps> = ({ label }) => {
  return (
    <div className="my-6">
      {label ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t-2 border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-800 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
              {label}
            </span>
          </div>
        </div>
      ) : (
        <div className="border-t-2 border-gray-300 dark:border-gray-600"></div>
      )}
    </div>
  );
};

export default SectionDividerField;
