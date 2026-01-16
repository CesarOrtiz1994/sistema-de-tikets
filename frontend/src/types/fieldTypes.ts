// Enums que coinciden con el backend
export enum FieldCategory {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECTION = 'SELECTION',
  DATE = 'DATE',
  FILE = 'FILE',
  ADVANCED = 'ADVANCED'
}

export enum ValidationType {
  REQUIRED = 'REQUIRED',
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
  MIN_VALUE = 'MIN_VALUE',
  MAX_VALUE = 'MAX_VALUE',
  PATTERN = 'PATTERN',
  EMAIL = 'EMAIL',
  URL = 'URL',
  PHONE = 'PHONE',
  CUSTOM = 'CUSTOM'
}

export enum SLAPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Interfaces para Field Types
export interface FieldType {
  id: string;
  name: string;
  label: string;
  category: FieldCategory;
  description?: string;
  icon?: string;
  hasOptions: boolean;
  allowMultiple: boolean;
  hasPlaceholder: boolean;
  hasDefaultValue: boolean;
  availableValidations?: any;
  componentType: string;
  inputProps?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces para Validation Rules
export interface ValidationRule {
  id: string;
  type: ValidationType;
  name: string;
  description?: string;
  requiresValue: boolean;
  valueType?: string;
  defaultErrorMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces para SLA Configuration
export interface SLAConfiguration {
  id: string;
  name: string;
  description?: string;
  priority: SLAPriority;
  responseTime: number;
  resolutionTime: number;
  escalationEnabled: boolean;
  escalationTime?: number;
  businessHoursOnly: boolean;
  notifyOnBreach: boolean;
  notifyBefore?: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces para validaciones de campos dinámicos
export interface FieldValidation {
  type: ValidationType;
  value?: any;
  message?: string;
}

// Props base para componentes de campo
export interface BaseFieldProps {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  validations?: FieldValidation[];
  className?: string;
}

// Props específicos para campos de texto
export interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'url' | 'tel';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

// Props específicos para campos de número
export interface NumberFieldProps extends BaseFieldProps {
  min?: number;
  max?: number;
  step?: number;
}

// Props específicos para campos de selección
export interface SelectFieldProps extends BaseFieldProps {
  options: FieldOption[];
  multiple?: boolean;
  searchable?: boolean;
}

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Props específicos para campos de fecha
export interface DateFieldProps extends BaseFieldProps {
  type?: 'date' | 'time' | 'datetime' | 'daterange';
  minDate?: Date;
  maxDate?: Date;
  format?: string;
}

// Props específicos para campos de archivo
export interface FileFieldProps extends BaseFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

// Props específicos para checkbox/toggle
export interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
}

// Props específicos para radio
export interface RadioFieldProps extends BaseFieldProps {
  options: FieldOption[];
}

// Props específicos para textarea
export interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number;
  maxLength?: number;
  minLength?: number;
}
