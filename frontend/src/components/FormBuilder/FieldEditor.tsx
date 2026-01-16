import { useState, useEffect } from 'react';
import { z } from 'zod';
import { FiPlus, FiTrash2, FiMove } from 'react-icons/fi';
import Modal from '../Modal';
import ModalButtons from '../ModalButtons';
import FieldPreview from './FieldPreview';
import { FormField } from '../../services/forms.service';

interface FieldEditorProps {
  isOpen: boolean;
  onClose: () => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
  allFields: FormField[];
}

interface FieldOption {
  id: string;
  label: string;
  value: string;
  isDefault: boolean;
}

const fieldSchema = z.object({
  label: z.string().min(1, 'El label es requerido'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.boolean(),
  isVisible: z.boolean(),
});

export default function FieldEditor({ isOpen, onClose, field, onSave, allFields }: FieldEditorProps) {
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Validaciones generales
  const [minLength, setMinLength] = useState<number | undefined>();
  const [maxLength, setMaxLength] = useState<number | undefined>();
  const [pattern, setPattern] = useState('');
  
  // Configuración específica para NUMBER
  const [minValue, setMinValue] = useState<number | undefined>();
  const [maxValue, setMaxValue] = useState<number | undefined>();
  const [step, setStep] = useState<number | undefined>();
  
  // Configuración específica para FILE
  const [acceptedFileTypes, setAcceptedFileTypes] = useState('');
  const [maxFileSize, setMaxFileSize] = useState<number | undefined>();
  const [allowMultiple, setAllowMultiple] = useState(false);
  
  // Lógica condicional
  const [hasConditional, setHasConditional] = useState(false);
  const [conditionalField, setConditionalField] = useState('');
  const [conditionalOperator, setConditionalOperator] = useState('equals');
  const [conditionalValue, setConditionalValue] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label || '');
      setPlaceholder(field.placeholder || '');
      setHelpText(field.helpText || '');
      setIsRequired(field.isRequired || false);
      setIsVisible(field.isVisible !== false);
      
      // Cargar opciones si existen
      if (field.options && field.options.length > 0) {
        setOptions(field.options.map((opt) => ({
          id: opt.id || crypto.randomUUID(),
          label: opt.label,
          value: opt.value,
          isDefault: opt.isDefault || false
        })));
      } else {
        setOptions([]);
      }
      
      // Cargar validaciones
      if (field.validations) {
        const validations = typeof field.validations === 'string' 
          ? JSON.parse(field.validations) 
          : field.validations;
        setMinLength(validations.minLength);
        setMaxLength(validations.maxLength);
        setPattern(validations.pattern || '');
        setMinValue(validations.minValue);
        setMaxValue(validations.maxValue);
        setStep(validations.step);
        setAcceptedFileTypes(validations.acceptedFileTypes || '');
        setMaxFileSize(validations.maxFileSize);
        setAllowMultiple(validations.allowMultiple || false);
      }
      
      // Cargar lógica condicional
      if (field.conditionalLogic) {
        const logic = typeof field.conditionalLogic === 'string'
          ? JSON.parse(field.conditionalLogic)
          : field.conditionalLogic;
        setHasConditional(true);
        setConditionalField(logic.field || '');
        setConditionalOperator(logic.operator || 'equals');
        setConditionalValue(logic.value || '');
      }
    }
  }, [field]);

  const handleAddOption = () => {
    setOptions([...options, {
      id: crypto.randomUUID(),
      label: '',
      value: '',
      isDefault: false
    }]);
  };

  const handleUpdateOption = (id: string, updates: Partial<FieldOption>) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, ...updates } : opt
    ));
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleSetDefaultOption = (id: string) => {
    setOptions(options.map(opt => ({
      ...opt,
      isDefault: opt.id === id
    })));
  };

  const handleSave = () => {
    try {
      // Validar campos básicos
      fieldSchema.parse({
        label,
        placeholder,
        helpText,
        isRequired,
        isVisible
      });

      if (!field) return;

      // Construir validaciones
      const validations: any = {};
      if (minLength) validations.minLength = minLength;
      if (maxLength) validations.maxLength = maxLength;
      if (pattern) validations.pattern = pattern;
      if (minValue !== undefined) validations.minValue = minValue;
      if (maxValue !== undefined) validations.maxValue = maxValue;
      if (step) validations.step = step;
      if (acceptedFileTypes) validations.acceptedFileTypes = acceptedFileTypes;
      if (maxFileSize) validations.maxFileSize = maxFileSize;
      if (allowMultiple) validations.allowMultiple = allowMultiple;

      // Construir lógica condicional
      let conditionalLogic = null;
      if (hasConditional && conditionalField && conditionalValue) {
        conditionalLogic = {
          field: conditionalField,
          operator: conditionalOperator,
          value: conditionalValue
        };
      }

      const updatedField: FormField = {
        ...field,
        label,
        placeholder: placeholder || undefined,
        helpText: helpText || undefined,
        isRequired,
        isVisible,
        options: needsOptions(field.fieldType) 
          ? options.map((opt, idx) => ({
              id: opt.id,
              fieldId: field.id,
              label: opt.label,
              value: opt.value,
              order: idx,
              isDefault: opt.isDefault
            }))
          : undefined,
        validations: Object.keys(validations).length > 0 ? validations : undefined,
        conditionalLogic: conditionalLogic || undefined
      };

      onSave(updatedField);
      setErrors({});
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const needsOptions = (fieldType?: { code?: string; name?: string; [key: string]: any }) => {
    if (!fieldType) {
      console.log('needsOptions: no fieldType', fieldType);
      return false;
    }
    // Usar 'code' si existe, sino usar 'name'
    const typeCode = (fieldType.code || fieldType.name || '').toLowerCase();
    console.log('needsOptions checking typeCode:', typeCode);
    const result = ['select', 'radio', 'checkbox', 'multiselect', 'toggle'].includes(typeCode);
    console.log('needsOptions result:', result);
    return result;
  };

  const getAvailableValidations = () => {
    if (!field?.fieldType) return [];
    const code = (field.fieldType.code || field.fieldType.name || '').toLowerCase();
    
    const validations = [];
    
    // TEXT types
    if (['text', 'textarea', 'email', 'url', 'phone'].includes(code)) {
      validations.push('minLength', 'maxLength');
    }
    
    if (['text', 'email', 'url', 'phone'].includes(code)) {
      validations.push('pattern');
    }
    
    // NUMBER types
    if (['number', 'currency', 'rating'].includes(code)) {
      validations.push('minValue', 'maxValue', 'step');
    }
    
    // FILE types
    if (['file', 'image', 'multifile'].includes(code)) {
      validations.push('fileConfig');
    }
    
    // DATE types - no necesitan configuración adicional, usan el input nativo del navegador
    // DATE, TIME, DATETIME, DATERANGE
    
    // SELECTION types - usan el editor de opciones
    // SELECT, MULTISELECT, RADIO, CHECKBOX, TOGGLE
    
    // ADVANCED types - configuraciones básicas (label, placeholder, required, visible)
    // FIRMA (SIGNATURE), LOCATION, COLOR
    
    return validations;
  };

  if (!field) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Campo"
      subtitle={`Tipo: ${field.fieldType?.name || 'Campo'}`}
      size="lg"
      footer={
        <ModalButtons
          onCancel={onClose}
          onConfirm={handleSave}
          confirmText="Guardar Cambios"
          variant="primary"
        />
      }
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
        {/* Configuración Básica */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Configuración Básica
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Label del campo *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.label ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ej: Nombre completo"
            />
            {errors.label && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.label}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Placeholder
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Ingrese su nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Texto de ayuda
            </label>
            <textarea
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Texto que aparecerá debajo del campo"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Campo obligatorio</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Campo visible</span>
            </label>
          </div>
        </div>

        {/* Vista Previa en Tiempo Real */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Vista Previa
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FieldPreview
              field={field}
              label={label}
              placeholder={placeholder}
              helpText={helpText}
              isRequired={isRequired}
              options={options}
            />
          </div>
        </div>

        {/* Editor de Opciones */}
        {needsOptions(field.fieldType) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Opciones
              </h3>
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {options.map((option) => (
                <div key={option.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FiMove className="w-4 h-4 text-gray-400 cursor-move" />
                  
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(option.id, { label: e.target.value, value: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Etiqueta de la opción"
                  />

                  <button
                    onClick={() => handleSetDefaultOption(option.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      option.isDefault
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Marcar como predeterminada"
                  >
                    {option.isDefault ? 'Por defecto' : 'Predeterminar'}
                  </button>

                  <button
                    onClick={() => handleDeleteOption(option.id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {options.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay opciones. Haz clic en "Agregar" para crear una.
              </p>
            )}
          </div>
        )}

        {/* Validaciones */}
        {getAvailableValidations().length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Validaciones
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {getAvailableValidations().includes('minLength') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitud mínima
                  </label>
                  <input
                    type="number"
                    value={minLength || ''}
                    onChange={(e) => setMinLength(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 3"
                    min="0"
                  />
                </div>
              )}

              {getAvailableValidations().includes('maxLength') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitud máxima
                  </label>
                  <input
                    type="number"
                    value={maxLength || ''}
                    onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 100"
                    min="0"
                  />
                </div>
              )}
            </div>

            {getAvailableValidations().includes('pattern') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patrón (RegEx)
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Ej: ^[A-Z]{3}-\d{4}$"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Expresión regular para validar el formato
                </p>
              </div>
            )}

            {/* Validaciones para NUMBER */}
            {getAvailableValidations().includes('minValue') && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor mínimo
                  </label>
                  <input
                    type="number"
                    value={minValue ?? ''}
                    onChange={(e) => setMinValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor máximo
                  </label>
                  <input
                    type="number"
                    value={maxValue ?? ''}
                    onChange={(e) => setMaxValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Incremento (step)
                  </label>
                  <input
                    type="number"
                    value={step ?? ''}
                    onChange={(e) => setStep(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 1"
                    step="any"
                  />
                </div>
              </div>
            )}

            {/* Configuración para FILE */}
            {getAvailableValidations().includes('fileConfig') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipos de archivo permitidos
                  </label>
                  <input
                    type="text"
                    value={acceptedFileTypes}
                    onChange={(e) => setAcceptedFileTypes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: .pdf,.doc,.docx o image/*"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Extensiones separadas por comas o tipos MIME (image/*, application/pdf)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamaño máximo (MB)
                  </label>
                  <input
                    type="number"
                    value={maxFileSize ?? ''}
                    onChange={(e) => setMaxFileSize(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 5"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tamaño máximo del archivo en megabytes
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Permitir múltiples archivos</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Lógica Condicional */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Lógica Condicional
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConditional}
                onChange={(e) => setHasConditional(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Activar</span>
            </label>
          </div>

          {hasConditional && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrar este campo solo si:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Campo
                  </label>
                  <select
                    value={conditionalField}
                    onChange={(e) => setConditionalField(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {allFields
                      .filter(f => f.id !== field.id)
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Operador
                  </label>
                  <select
                    value={conditionalOperator}
                    onChange={(e) => setConditionalOperator(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="equals">Es igual a</option>
                    <option value="not_equals">No es igual a</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={conditionalValue}
                    onChange={(e) => setConditionalValue(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Valor..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
