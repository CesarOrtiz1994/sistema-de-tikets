import React from 'react';

interface SectionTitleFieldProps {
  label: string;
  helpText?: string;
}

const SectionTitleField: React.FC<SectionTitleFieldProps> = ({ label, helpText }) => {
  return (
    <div className="mb-6 mt-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-purple-600 pb-2">
        {label}
      </h3>
      {helpText && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default SectionTitleField;
