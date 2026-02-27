import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiSend, FiAlertCircle } from 'react-icons/fi';
import { FormField, TicketForm } from '../../services/forms.service';
import { useFormValidation } from '../../hooks/useFormValidation';
import LoadingSpinner from '../common/LoadingSpinner';
import ValidationError from '../common/ValidationError';
import FormProgress from '../common/FormProgress';
import Card from '../common/Card';
import {
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
  MultiSelectField,
  RadioField,
  CheckboxGroupField,
  ToggleField,
  DateField,
  FileField,
  ColorField,
  SignatureField,
  RatingField,
} from '../fields';
import SectionTitleField from '../fields/SectionTitleField';
import SectionDividerField from '../fields/SectionDividerField';

interface DynamicFormRendererProps {
  form: TicketForm;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  submitButtonText?: string;
  showProgress?: boolean;
  className?: string;
}

export default function DynamicFormRenderer({
  form,
  onSubmit,
  submitButtonText = 'Enviar',
  showProgress = true,
  className = '',
}: DynamicFormRendererProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleFields = (form.fields || []).filter((f) => f.isVisible);
  const sortedFields = [...visibleFields].sort((a, b) => a.order - b.order);

  // Evaluar lógica condicional
  const evaluateCondition = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true;

    const logic = typeof field.conditionalLogic === 'string'
      ? JSON.parse(field.conditionalLogic)
      : field.conditionalLogic;

    if (!logic.field || !logic.operator) return true;

    const dependentValue = values[logic.field];
    const conditionValue = logic.value;

    switch (logic.operator) {
      case 'equals':
        return dependentValue === conditionValue;
      case 'not_equals':
        return dependentValue !== conditionValue;
      default:
        return true;
    }
  };

  const {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    getProgress,
    getMissingRequiredFields,
  } = useFormValidation(sortedFields);

  // Inicializar valores por defecto
  useEffect(() => {
    sortedFields.forEach((field) => {
      if (field.defaultValue && !values[field.id]) {
        setValue(field.id, field.defaultValue);
      }
    });
  }, [sortedFields]);

  // Renderizar campo según su tipo
  const renderField = (field: FormField) => {
    const fieldTypeName = field.fieldType?.name?.toUpperCase();
    const commonProps = {
      name: field.id,
      label: field.label,
      value: values[field.id] || '',
      onChange: (value: any) => setValue(field.id, value),
      onBlur: () => setFieldTouched(field.id),
      error: touched.has(field.id) ? errors[field.id] : undefined,
      disabled: isSubmitting,
      required: field.isRequired,
      placeholder: field.placeholder,
      helpText: field.helpText,
    };

    switch (fieldTypeName) {
      // Campos de texto
      case 'TEXT':
        return <TextField {...commonProps} type="text" />;
      
      case 'EMAIL':
        return <TextField {...commonProps} type="email" />;
      
      case 'PHONE':
        return <TextField {...commonProps} type="tel" />;
      
      case 'URL':
        return <TextField {...commonProps} type="url" />;

      case 'TEXTAREA':
        return <TextAreaField {...commonProps} />;

      // Campos numéricos
      case 'NUMBER':
      case 'CURRENCY':
        console.log(`Campo ${field.label}:`, {
          validationRules: field.validationRules,
          minValue: field.validationRules?.minValue,
          maxValue: field.validationRules?.maxValue,
          step: field.validationRules?.step
        });
        return (
          <NumberField
            {...commonProps}
            min={field.validationRules?.minValue}
            max={field.validationRules?.maxValue}
            step={field.validationRules?.step || (fieldTypeName === 'CURRENCY' ? 0.01 : undefined)}
          />
        );

      case 'RATING':
        return (
          <RatingField
            {...commonProps}
            max={5}
          />
        );

      // Campos de selección
      case 'SELECT':
        return (
          <SelectField
            {...commonProps}
            options={field.options?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })) || []}
          />
        );

      case 'MULTISELECT':
        return (
          <MultiSelectField
            {...commonProps}
            options={field.options?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })) || []}
          />
        );

      case 'RADIO':
        return (
          <RadioField
            {...commonProps}
            options={field.options?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })) || []}
          />
        );

      case 'CHECKBOX':
        return (
          <CheckboxGroupField
            {...commonProps}
            options={field.options?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })) || []}
          />
        );

      case 'TOGGLE':
        return (
          <ToggleField
            {...commonProps}
            checked={values[field.id] || false}
            onChange={(checked: boolean) => setValue(field.id, checked)}
          />
        );

      // Campos de fecha
      case 'DATE':
        return <DateField {...commonProps} type="date" />;

      case 'DATETIME':
        return <DateField {...commonProps} type="datetime" />;

      case 'TIME':
        return <DateField {...commonProps} type="time" />;

      case 'DATERANGE':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <DateField
                {...commonProps}
                label="Fecha inicio"
                type="date"
                value={values[field.id]?.start || ''}
                onChange={(val) => setValue(field.id, { ...values[field.id], start: val })}
              />
              <DateField
                {...commonProps}
                label="Fecha fin"
                type="date"
                value={values[field.id]?.end || ''}
                onChange={(val) => setValue(field.id, { ...values[field.id], end: val })}
              />
            </div>
            {field.helpText && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
            )}
          </div>
        );

      // Campos de archivo
      case 'FILE':
      case 'MULTIFILE':
        return (
          <FileField
            {...commonProps}
            accept={field.validationRules?.acceptedFileTypes || '*/*'}
            maxSize={field.validationRules?.maxFileSize}
            multiple={fieldTypeName === 'MULTIFILE'}
            fieldType={fieldTypeName as 'FILE' | 'MULTIFILE'}
          />
        );

      case 'IMAGE':
        return (
          <FileField
            {...commonProps}
            accept={field.validationRules?.acceptedFileTypes || 'image/*'}
            maxSize={field.validationRules?.maxFileSize}
            fieldType="IMAGE"
          />
        );

      // Campos avanzados
      case 'FIRMA':
        return <SignatureField {...commonProps} />;

      case 'COLOR':
        return <ColorField {...commonProps} />;

      // Campos de sección
      case 'SECTION_TITLE':
        return <SectionTitleField label={field.label} helpText={field.helpText} />;

      case 'SECTION_DIVIDER':
        return <SectionDividerField label={field.label} />;

      default:
        console.warn(`Tipo de campo no reconocido: ${fieldTypeName}`);
        return <TextField {...commonProps} type="text" />;
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const isValid = validateAll();

    if (!isValid) {
      const missingFields = getMissingRequiredFields();
      if (missingFields.length > 0) {
        toast.error(
          `Por favor completa los campos requeridos: ${missingFields.map((f) => f.label).join(', ')}`
        )
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      console.log('Formulario enviado exitosamente');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = getProgress();
  const filledFields = sortedFields.filter((field) => {
    const value = values[field.id];
    return value !== undefined && value !== null && value !== '';
  }).length;

  return (
    <div className={className}>
      {/* Información del formulario */}
      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {form.name}
        </h2>
        {form.description && (
          <p className="text-gray-600 dark:text-gray-400">{form.description}</p>
        )}
      </Card>

      {/* Barra de progreso */}
      {showProgress && (
        <div className="mb-6">
          <FormProgress
            progress={progress}
            totalFields={sortedFields.length}
            filledFields={filledFields}
          />
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {sortedFields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              {sortedFields.map((field) => {
                // Evaluar si el campo debe mostrarse según su lógica condicional
                if (!evaluateCondition(field)) {
                  return null;
                }

                const span = field.columnSpan || 3;
                // span 1 = 33% (2 cols de 6), span 2 = 50% (3 cols de 6), span 3 = 100% (6 cols de 6)
                const colSpanClass = span === 3 ? 'md:col-span-6' : span === 2 ? 'md:col-span-3' : 'md:col-span-2';
                
                return (
                  <div key={field.id} className={colSpanClass}>
                    {renderField(field)}
                    {touched.has(field.id) && errors[field.id] && (
                      <ValidationError message={errors[field.id]} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FiAlertCircle className="mx-auto text-4xl mb-2" />
              <p>Este formulario no tiene campos configurados</p>
            </div>
          )}
        </Card>

        {/* Botón de envío */}
        {sortedFields.length > 0 && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-brand-gradient bg-brand-gradient-hover text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <FiSend />
                  <span>{submitButtonText}</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
