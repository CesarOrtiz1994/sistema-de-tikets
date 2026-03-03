import { useState, useEffect } from 'react';
import { z } from 'zod';
import { FiPlus, FiTrash2, FiMove } from 'react-icons/fi';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';
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
  const [columnSpan, setColumnSpan] = useState<1 | 2 | 3>(3);
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
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number | undefined>();
  const [allowMultiple, setAllowMultiple] = useState(false);
  
  // Lógica condicional
  const [hasConditional, setHasConditional] = useState(false);
  const [conditionalField, setConditionalField] = useState('');
  const [conditionalOperator, setConditionalOperator] = useState('equals');
  const [conditionalValue, setConditionalValue] = useState('');
  
  // Obtener campo seleccionado para lógica condicional
  const selectedConditionalField = allFields.find(f => f.id === conditionalField);
  const conditionalFieldOptions = selectedConditionalField?.options || [];

  useEffect(() => {
    if (field) {
      setLabel(field.label || '');
      setPlaceholder(field.placeholder || '');
      setHelpText(field.helpText || '');
      setIsRequired(field.isRequired || false);
      setIsVisible(field.isVisible !== false);
      setColumnSpan(field.columnSpan || 3);
      
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
      if (field.validationRules) {
        const rules = typeof field.validationRules === 'string' 
          ? JSON.parse(field.validationRules) 
          : field.validationRules;
        setMinLength(rules.minLength);
        setMaxLength(rules.maxLength);
        setPattern(rules.pattern || '');
        setMinValue(rules.minValue);
        setMaxValue(rules.maxValue);
        setStep(rules.step);
        setAcceptedFileTypes(rules.acceptedFileTypes || '');
        // Convertir de bytes a MB para mostrar
        setMaxFileSizeMB(rules.maxFileSize ? rules.maxFileSize / (1024 * 1024) : undefined);
        setAllowMultiple(rules.allowMultiple || false);
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

      // Construir validaciones solo si son aplicables al tipo de campo
      const availableValidations = getAvailableValidations();
      const validations: any = {};
      
      // Solo agregar validaciones que sean aplicables al tipo de campo
      if (availableValidations.includes('minLength') && minLength) validations.minLength = minLength;
      if (availableValidations.includes('maxLength') && maxLength) validations.maxLength = maxLength;
      if (availableValidations.includes('pattern') && pattern) validations.pattern = pattern;
      if (availableValidations.includes('minValue') && minValue !== undefined) validations.minValue = minValue;
      if (availableValidations.includes('maxValue') && maxValue !== undefined) validations.maxValue = maxValue;
      if (availableValidations.includes('step') && step) validations.step = step;
      if (availableValidations.includes('fileConfig') && acceptedFileTypes) validations.acceptedFileTypes = acceptedFileTypes;
      // Convertir de MB a bytes para guardar
      if (availableValidations.includes('fileConfig') && maxFileSizeMB) validations.maxFileSize = maxFileSizeMB * 1024 * 1024;
      if (availableValidations.includes('fileConfig') && allowMultiple) validations.allowMultiple = allowMultiple;

      // Construir lógica condicional
      let conditionalLogic = null;
      if (hasConditional && conditionalField) {
        conditionalLogic = {
          field: conditionalField,
          operator: conditionalOperator,
          value: conditionalValue || ''
        };
      }

      const updatedField: FormField = {
        ...field,
        label,
        placeholder: placeholder || undefined,
        helpText: helpText || undefined,
        isRequired,
        isVisible,
        columnSpan,
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
        validationRules: Object.keys(validations).length > 0 ? validations : undefined,
        conditionalLogic: conditionalLogic || undefined
      };

      onSave(updatedField);
      resetForm();
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
  
  const isSelectionField = (fieldType?: { code?: string; name?: string; [key: string]: any }) => {
    if (!fieldType) return false;
    const typeCode = (fieldType.code || fieldType.name || '').toLowerCase();
    return ['select', 'radio', 'checkbox', 'multiselect'].includes(typeCode);
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setLabel('');
    setPlaceholder('');
    setHelpText('');
    setIsRequired(false);
    setIsVisible(true);
    setColumnSpan(3);
    setOptions([]);
    setErrors({});
    setMinLength(undefined);
    setMaxLength(undefined);
    setPattern('');
    setMinValue(undefined);
    setMaxValue(undefined);
    setStep(undefined);
    setAcceptedFileTypes('');
    setMaxFileSizeMB(undefined);
    setAllowMultiple(false);
    setHasConditional(false);
    setConditionalField('');
    setConditionalOperator('equals');
    setConditionalValue('');
  };

  // Resetear formulario al cerrar el modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getAvailableValidations = (): string[] => {
    const validations: string[] = [];
    // Usar code si existe, sino name
    const typeCode = (field?.fieldType?.code || field?.fieldType?.name || '').toLowerCase();
    
    // TEXT types - solo TEXT y TEXTAREA necesitan minLength/maxLength
    // EMAIL, URL, PHONE ya tienen validación específica de formato
    if (['text', 'textarea'].includes(typeCode)) {
      validations.push('minLength', 'maxLength');
    }
    
    // Solo TEXT necesita patrón personalizado
    // EMAIL, URL, PHONE ya tienen validación de formato incorporada
    if (typeCode === 'text') {
      validations.push('pattern');
    }
    
    // NUMBER types - RATING no necesita validaciones porque tiene estrellas fijas
    if (['number', 'currency'].includes(typeCode)) {
      validations.push('minValue', 'maxValue', 'step');
    }
    
    // FILE types
    if (['file', 'image', 'multifile'].includes(typeCode)) {
      validations.push('fileConfig');
    }
    
    // DATE types - no necesitan configuración adicional, usan el input nativo del navegador
    // DATE, TIME, DATETIME, DATERANGE
    
    // SELECTION types - usan el editor de opciones
    // SELECT, MULTISELECT, RADIO, CHECKBOX, TOGGLE
    
    // ADVANCED types - configuraciones básicas (label, placeholder, required, visible)
    // FIRMA (SIGNATURE), COLOR
    
    return validations;
  };

  if (!field) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Configurar Campo"
      subtitle={`Tipo: ${field.fieldType?.name || 'Campo'}`}
      size="lg"
      footer={
        <ModalButtons
          onCancel={handleClose}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ancho del campo
            </label>
            <select
              value={columnSpan}
              onChange={(e) => setColumnSpan(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={1}>33% - Un tercio</option>
              <option value={2}>50% - Mitad</option>
              <option value={3}>100% - Ancho completo</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Define cuánto espacio horizontal ocupará el campo en el formulario
            </p>
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
                className="flex items-center gap-1 px-3 py-1 text-sm bg-brand-gradient bg-brand-gradient-hover text-white rounded-lg hover:shadow-lg transition-all duration-200"
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
                  
                  {/* Opciones para IMAGE */}
                  {field?.fieldType && (field.fieldType.code || field.fieldType.name || '').toLowerCase() === 'image' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Selecciona los formatos de imagen permitidos:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: '.jpg,.jpeg', label: 'JPG/JPEG' },
                          { value: '.png', label: 'PNG' },
                          { value: '.gif', label: 'GIF' },
                          { value: '.webp', label: 'WebP' },
                          { value: '.svg', label: 'SVG' },
                          { value: '.bmp', label: 'BMP' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={acceptedFileTypes.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAcceptedFileTypes(prev => prev ? `${prev},${option.value}` : option.value);
                                } else {
                                  setAcceptedFileTypes(prev => 
                                    prev.split(',').filter(v => v !== option.value).join(',')
                                  );
                                }
                              }}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opciones para FILE */}
                  {field?.fieldType && (field.fieldType.code || field.fieldType.name || '').toLowerCase() === 'file' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Selecciona los tipos de archivo permitidos:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: '.pdf', label: 'PDF' },
                          { value: '.doc,.docx', label: 'Word (DOC/DOCX)' },
                          { value: '.xls,.xlsx', label: 'Excel (XLS/XLSX)' },
                          { value: '.csv', label: 'CSV' },
                          { value: '.txt', label: 'Texto (TXT)' },
                          { value: '.ppt,.pptx', label: 'PowerPoint (PPT/PPTX)' }
                        ].map((option) => {
                          const optionExtensions = option.value.split(',');
                          const currentExtensions = acceptedFileTypes.split(',').filter(v => v.trim());
                          const isChecked = optionExtensions.every(ext => currentExtensions.includes(ext));
                          
                          return (
                          <label key={option.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newExtensions = [...currentExtensions, ...optionExtensions];
                                  const uniqueExtensions = Array.from(new Set(newExtensions)).filter(v => v);
                                  setAcceptedFileTypes(uniqueExtensions.join(','));
                                } else {
                                  const remainingExtensions = currentExtensions.filter(ext => !optionExtensions.includes(ext));
                                  setAcceptedFileTypes(remainingExtensions.join(','));
                                }
                              }}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                          </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Opciones para MULTIFILE (Imágenes + Archivos) */}
                  {field?.fieldType && (field.fieldType.code || field.fieldType.name || '').toLowerCase() === 'multifile' && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Formatos de imagen:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: '.jpg,.jpeg', label: 'JPG/JPEG' },
                            { value: '.png', label: 'PNG' },
                            { value: '.gif', label: 'GIF' },
                            { value: '.webp', label: 'WebP' },
                            { value: '.svg', label: 'SVG' },
                            { value: '.bmp', label: 'BMP' }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={acceptedFileTypes.includes(option.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAcceptedFileTypes(prev => prev ? `${prev},${option.value}` : option.value);
                                  } else {
                                    setAcceptedFileTypes(prev => 
                                      prev.split(',').filter(v => v !== option.value).join(',')
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Formatos de documento:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: '.pdf', label: 'PDF' },
                            { value: '.doc,.docx', label: 'Word (DOC/DOCX)' },
                            { value: '.xls,.xlsx', label: 'Excel (XLS/XLSX)' },
                            { value: '.csv', label: 'CSV' },
                            { value: '.txt', label: 'Texto (TXT)' },
                            { value: '.ppt,.pptx', label: 'PowerPoint (PPT/PPTX)' }
                          ].map((option) => {
                            const optionExtensions = option.value.split(',');
                            const currentExtensions = acceptedFileTypes.split(',').filter(v => v.trim());
                            const isChecked = optionExtensions.every(ext => currentExtensions.includes(ext));
                            
                            return (
                            <label key={option.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newExtensions = [...currentExtensions, ...optionExtensions];
                                    const uniqueExtensions = Array.from(new Set(newExtensions)).filter(v => v);
                                    setAcceptedFileTypes(uniqueExtensions.join(','));
                                  } else {
                                    const remainingExtensions = currentExtensions.filter(ext => !optionExtensions.includes(ext));
                                    setAcceptedFileTypes(remainingExtensions.join(','));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                            </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {acceptedFileTypes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Tipos seleccionados: <span className="font-mono">{acceptedFileTypes}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamaño máximo (MB)
                  </label>
                  <input
                    type="number"
                    value={maxFileSizeMB ?? ''}
                    onChange={(e) => setMaxFileSizeMB(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 10"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tamaño máximo del archivo en megabytes (máximo 100MB)
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
                    onChange={(e) => {
                      setConditionalField(e.target.value);
                      setConditionalValue(''); // Resetear valor al cambiar campo
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {allFields
                      .filter(f => f.id !== field.id && isSelectionField(f.fieldType))
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.label} ({f.fieldType?.name})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Solo campos de selección
                  </p>
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
                  {conditionalField && conditionalFieldOptions.length > 0 ? (
                    <select
                      value={conditionalValue}
                      onChange={(e) => setConditionalValue(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar...</option>
                      {conditionalFieldOptions.map(opt => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={conditionalValue}
                      onChange={(e) => setConditionalValue(e.target.value)}
                      disabled={!conditionalField}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={conditionalField ? "Sin opciones" : "Selecciona un campo"}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
