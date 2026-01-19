# DynamicFormRenderer - Guía de Uso

## Descripción
Sistema completo de renderizado dinámico de formularios con validaciones en tiempo real usando Zod.

## Componentes Creados

### 1. DynamicFormRenderer
**Ubicación:** `src/components/DynamicForm/DynamicFormRenderer.tsx`

Componente principal que renderiza formularios dinámicamente basándose en la estructura del backend.

**Props:**
```typescript
interface DynamicFormRendererProps {
  form: TicketForm;                              // Formulario con fields y options
  onSubmit: (values: Record<string, any>) => void | Promise<void>;  // Callback al enviar
  submitButtonText?: string;                     // Texto del botón (default: "Enviar")
  showProgress?: boolean;                        // Mostrar barra de progreso (default: true)
  className?: string;                            // Clases CSS adicionales
}
```

**Características:**
- ✅ Renderiza campos en orden según `field.order`
- ✅ Aplica validaciones en tiempo real con Zod
- ✅ Muestra solo campos visibles (`field.isVisible`)
- ✅ Soporta valores por defecto (`field.defaultValue`)
- ✅ Validación de campos requeridos (`field.isRequired`)
- ✅ Barra de progreso de completitud
- ✅ Manejo de errores con toast notifications
- ✅ Loading state durante envío

**Tipos de campo soportados:**
- TEXT, EMAIL, PHONE, URL
- TEXTAREA
- NUMBER (con min/max)
- SELECT (con opciones)
- RADIO (con opciones)
- CHECKBOX
- DATE, DATETIME
- FILE (con accept y maxSize)
- COLOR

### 2. useFormValidation Hook
**Ubicación:** `src/hooks/useFormValidation.ts`

Hook personalizado para manejar validaciones de formularios dinámicos con Zod.

**Retorna:**
```typescript
{
  values: FormValues;                           // Valores actuales del formulario
  errors: ValidationErrors;                     // Errores de validación por campo
  touched: Set<string>;                         // Campos que han sido tocados
  setValue: (fieldId: string, value: any) => void;  // Actualizar valor de campo
  setFieldTouched: (fieldId: string) => void;   // Marcar campo como tocado
  validateField: (field: FormField, value: any) => string | null;  // Validar campo individual
  validateAll: () => boolean;                   // Validar todos los campos
  reset: () => void;                            // Resetear formulario
  getProgress: () => number;                    // Obtener % de progreso (0-100)
  getMissingRequiredFields: () => FormField[];  // Obtener campos requeridos faltantes
  isValid: boolean;                             // Si el formulario es válido
}
```

**Validaciones soportadas:**
- Required (campo requerido)
- Min/Max length (para strings)
- Min/Max value (para números)
- Email format
- URL format
- Phone format
- Custom regex patterns

### 3. ValidationError
**Ubicación:** `src/components/common/ValidationError.tsx`

Componente para mostrar mensajes de error de validación.

**Props:**
```typescript
interface ValidationErrorProps {
  message: string;      // Mensaje de error
  className?: string;   // Clases CSS adicionales
}
```

### 4. FormProgress
**Ubicación:** `src/components/common/FormProgress.tsx`

Componente que muestra el progreso de completitud del formulario.

**Props:**
```typescript
interface FormProgressProps {
  progress: number;      // Porcentaje de progreso (0-100)
  totalFields: number;   // Total de campos
  filledFields: number;  // Campos completados
}
```

## Uso Básico

### Ejemplo 1: Renderizar formulario activo de un departamento

```tsx
import { useState, useEffect } from 'react';
import DynamicFormRenderer from '../components/DynamicForm/DynamicFormRenderer';
import { formsService, TicketForm } from '../services/forms.service';
import { toast } from 'sonner';

function CreateTicketPage() {
  const [form, setForm] = useState<TicketForm | null>(null);
  const departmentId = 'your-department-id';

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    try {
      const activeForm = await formsService.getActiveDepartmentForm(departmentId);
      setForm(activeForm);
    } catch (error) {
      toast.error('Error al cargar el formulario');
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    console.log('Form values:', values);
    // Aquí va tu lógica para crear el ticket
    // await ticketsService.createTicket({ ...values, departmentId });
    toast.success('Ticket creado exitosamente');
  };

  if (!form) return <div>Cargando...</div>;

  return (
    <DynamicFormRenderer
      form={form}
      onSubmit={handleSubmit}
      submitButtonText="Crear Ticket"
      showProgress={true}
    />
  );
}
```

### Ejemplo 2: Usar el hook de validación directamente

```tsx
import { useFormValidation } from '../hooks/useFormValidation';

function CustomForm({ fields }) {
  const {
    values,
    errors,
    setValue,
    setFieldTouched,
    validateAll,
    getProgress
  } = useFormValidation(fields);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      console.log('Form is valid:', values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(field => (
        <div key={field.id}>
          <input
            value={values[field.id] || ''}
            onChange={(e) => setValue(field.id, e.target.value)}
            onBlur={() => setFieldTouched(field.id)}
          />
          {errors[field.id] && <span>{errors[field.id]}</span>}
        </div>
      ))}
      <div>Progreso: {getProgress()}%</div>
      <button type="submit">Enviar</button>
    </form>
  );
}
```

## Estructura de Datos

### TicketForm
```typescript
interface TicketForm {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  fields?: FormField[];
}
```

### FormField
```typescript
interface FormField {
  id: string;
  formId: string;
  fieldTypeId: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isVisible: boolean;
  order: number;
  defaultValue?: string;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
    accept?: string;      // Para FILE fields
    maxSize?: number;     // Para FILE fields
  };
  fieldType?: {
    id: string;
    name: string;        // TEXT, EMAIL, NUMBER, SELECT, etc.
    code: string;
    category: string;
  };
  options?: FieldOption[];
}
```

### FieldOption
```typescript
interface FieldOption {
  id: string;
  fieldId: string;
  label: string;
  value: string;
  order: number;
  isDefault: boolean;
}
```

## API Service

### Método agregado a formsService

```typescript
// Obtener formulario activo de un departamento
async getActiveDepartmentForm(departmentId: string): Promise<TicketForm>
```

**Endpoint:** `GET /api/forms/departments/:id/active-form`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "form-id",
    "name": "Formulario de Soporte",
    "description": "Formulario para crear tickets de soporte",
    "status": "ACTIVE",
    "department": {
      "id": "dept-id",
      "name": "Soporte Técnico"
    },
    "fields": [
      {
        "id": "field-1",
        "label": "Título",
        "isRequired": true,
        "isVisible": true,
        "order": 1,
        "fieldType": {
          "name": "TEXT"
        }
      }
    ]
  }
}
```

## Validaciones con Zod

El sistema crea esquemas de validación dinámicos basándose en:

1. **Tipo de campo:** Determina el tipo base (string, number, boolean, etc.)
2. **isRequired:** Aplica validación de campo requerido
3. **validationRules:** Aplica reglas adicionales (min, max, pattern, etc.)

### Ejemplos de validaciones:

```typescript
// Campo de texto requerido con longitud mínima
{
  fieldType: { name: 'TEXT' },
  isRequired: true,
  validationRules: { minLength: 5 }
}
// Genera: z.string().min(1, 'Campo requerido').min(5, 'Mínimo 5 caracteres')

// Campo de email
{
  fieldType: { name: 'EMAIL' },
  isRequired: true
}
// Genera: z.string().email('Email inválido').min(1, 'Campo requerido')

// Campo numérico con rango
{
  fieldType: { name: 'NUMBER' },
  isRequired: false,
  validationRules: { min: 0, max: 100 }
}
// Genera: z.number().min(0, 'Valor mínimo: 0').max(100, 'Valor máximo: 100').optional()
```

## Página de Prueba

**Ubicación:** `src/pages/DynamicFormTestPage.tsx`

Página de ejemplo que muestra cómo usar el DynamicFormRenderer:
- Carga el formulario activo de un departamento
- Maneja estados de loading y error
- Procesa el envío del formulario
- Muestra toast notifications

**Ruta sugerida:** `/departments/:departmentId/form`

## Próximos Pasos (SEMANA 11-13)

1. **SEMANA 11:** Sistema de archivos
   - Implementar upload de archivos en FileField
   - Integrar con backend de almacenamiento

2. **SEMANA 12:** Creación de tickets
   - Integrar DynamicFormRenderer con sistema de tickets
   - Guardar respuestas de formulario en BD

3. **SEMANA 13:** Vista y gestión de tickets
   - Mostrar formularios completados
   - Editar tickets existentes

## Notas Técnicas

- ✅ Usa componentes de `/components/common/` para consistencia
- ✅ Validaciones con Zod para type-safety
- ✅ Toast notifications con sonner
- ✅ Dark mode compatible
- ✅ Responsive design
- ✅ TypeScript strict mode
- ✅ Accesibilidad (labels, required indicators)
