import { FormField } from '../../services/forms.service';

interface FieldPreviewProps {
  field: FormField;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  options?: Array<{ id: string; label: string; value: string; isDefault: boolean }>;
}

export default function FieldPreview({
  field,
  label,
  placeholder,
  helpText,
  isRequired,
  options = []
}: FieldPreviewProps) {
  const fieldTypeCode = (field.fieldType?.code || field.fieldType?.name || '').toLowerCase();

  const renderField = () => {
    // TEXT types
    if (['text', 'email', 'url', 'phone'].includes(fieldTypeCode)) {
      return (
        <input
          type={fieldTypeCode === 'text' ? 'text' : fieldTypeCode}
          placeholder={placeholder}
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
        />
      );
    }

    // TEXTAREA
    if (fieldTypeCode === 'textarea') {
      return (
        <textarea
          placeholder={placeholder}
          disabled
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed resize-none"
        />
      );
    }

    // NUMBER types
    if (['number', 'currency', 'rating'].includes(fieldTypeCode)) {
      return (
        <input
          type="number"
          placeholder={placeholder}
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
        />
      );
    }

    // SELECT
    if (fieldTypeCode === 'select') {
      return (
        <select
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
        >
          <option>{placeholder || 'Seleccionar...'}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // MULTISELECT
    if (fieldTypeCode === 'multiselect') {
      return (
        <select
          multiple
          disabled
          size={Math.min(options.length + 1, 4)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // RADIO
    if (fieldTypeCode === 'radio') {
      return (
        <div 
          className={`
            grid gap-2
            ${options.length > 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}
          `}
        >
          {options.map((opt) => (
            <div key={opt.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  name="preview-radio"
                  disabled
                  defaultChecked={opt.isDefault}
                  className="w-4 h-4 text-purple-600 border-gray-300 cursor-not-allowed"
                />
              </div>
              <div className="ml-3">
                <label className="text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed">
                  {opt.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // CHECKBOX
    if (fieldTypeCode === 'checkbox') {
      return (
        <div 
          className={`
            grid gap-2
            ${options.length > 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}
          `}
        >
          {options.map((opt) => (
            <div key={opt.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked={opt.isDefault}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded cursor-not-allowed"
                />
              </div>
              <div className="ml-3">
                <label className="text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed">
                  {opt.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // TOGGLE
    if (fieldTypeCode === 'toggle') {
      return (
        <label className="relative inline-flex items-center cursor-not-allowed">
          <input type="checkbox" disabled className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 opacity-50"></div>
        </label>
      );
    }

    // DATE types
    if (['date', 'time', 'datetime'].includes(fieldTypeCode)) {
      return (
        <input
          type={fieldTypeCode === 'datetime' ? 'datetime-local' : fieldTypeCode}
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
        />
      );
    }

    // FILE types
    if (['file', 'image', 'multifile'].includes(fieldTypeCode)) {
      return (
        <div className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-center cursor-not-allowed">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            📎 Seleccionar archivo{fieldTypeCode === 'multifile' ? 's' : ''}
          </p>
        </div>
      );
    }

    // ADVANCED types
    if (fieldTypeCode === 'firma' || fieldTypeCode === 'signature') {
      return (
        <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center cursor-not-allowed">
          <p className="text-sm text-gray-500 dark:text-gray-400">✍️ Área de firma</p>
        </div>
      );
    }


    if (fieldTypeCode === 'color') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            disabled
            className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-not-allowed"
          />
          <input
            type="text"
            placeholder={placeholder || '#000000'}
            disabled
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
          />
        </div>
      );
    }

    // SECTION_TITLE
    if (fieldTypeCode === 'section-title' || fieldTypeCode === 'section_title') {
      return (
        <div className="mb-6 mt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-purple-600 pb-2">
            {label || 'Título de Sección'}
          </h3>
          {helpText && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {helpText}
            </p>
          )}
        </div>
      );
    }

    // SECTION_DIVIDER
    if (fieldTypeCode === 'section-divider' || fieldTypeCode === 'section_divider') {
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
    }

    // Default
    return (
      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Campo tipo: {field.fieldType?.name || 'Desconocido'}
        </p>
      </div>
    );
  };

  // Para SECTION_TITLE y SECTION_DIVIDER, renderizar directamente sin el wrapper de label
  if (fieldTypeCode === 'section-title' || fieldTypeCode === 'section_title' || 
      fieldTypeCode === 'section-divider' || fieldTypeCode === 'section_divider') {
    return renderField();
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label || 'Campo sin nombre'}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
