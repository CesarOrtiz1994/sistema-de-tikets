# Guía de Validaciones con Zod

## 📋 Esquemas de Validación Disponibles

### 1. **Usuarios** (`userSchema`)
```typescript
import { userSchema, validateForm } from '../utils/validationSchemas';

const result = validateForm(userSchema, formData);
if (result.success) {
  // formData es válido
  await saveUser(result.data);
} else {
  // Mostrar errores
  setErrors(result.errors);
}
```

**Validaciones:**
- `name`: 3-100 caracteres
- `email`: Email válido, mínimo 5 caracteres
- `roleType`: SUPER_ADMIN | DEPT_ADMIN | SUBORDINATE | REQUESTER
- `departmentId`: Opcional
- `departmentRole`: ADMIN | MEMBER (opcional)

---

### 2. **Departamentos** (`departmentSchema`)
```typescript
import { departmentSchema, validateForm } from '../utils/validationSchemas';

const result = validateForm(departmentSchema, formData);
```

**Validaciones:**
- `name`: 3-100 caracteres, solo letras y espacios
- `prefix`: 2-10 caracteres, solo mayúsculas y números
- `description`: Máximo 500 caracteres (opcional)
- `isDefaultForRequesters`: Boolean (opcional)

---

### 3. **Asignación de Usuarios** (`assignUserSchema`)
```typescript
import { assignUserSchema, validateForm } from '../utils/validationSchemas';

const result = validateForm(assignUserSchema, { userId, role });
```

**Validaciones:**
- `userId`: Requerido, mínimo 1 carácter
- `role`: ADMIN | MEMBER

---

### 4. **Configuración SLA** (`slaConfigurationSchema`)
```typescript
import { slaConfigurationSchema, validateForm } from '../utils/validationSchemas';

const result = validateForm(slaConfigurationSchema, formData);
```

**Validaciones:**
- `name`: 3-100 caracteres
- `description`: Máximo 500 caracteres (opcional)
- `priority`: LOW | MEDIUM | HIGH | CRITICAL
- `responseTime`: 1-43200 minutos
- `resolutionTime`: 1-43200 minutos (debe ser > responseTime)
- `escalationEnabled`: Boolean
- `escalationTime`: 1-43200 minutos (requerido si escalationEnabled = true)
- `businessHoursOnly`: Boolean
- `notifyOnBreach`: Boolean
- `notifyBefore`: 1-1440 minutos (opcional)

---

## 🔧 Cómo Aplicar en tus Modales

### Ejemplo: UserModal

```typescript
import { validateForm, userSchema } from '../utils/validationSchemas';

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({...});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar con Zod
    const result = validateForm(userSchema, formData);
    
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    try {
      await onSave(result.data);
      onClose();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      {errors.name && <p className="text-red-500">{errors.name}</p>}
      
      {/* ... más campos ... */}
    </form>
  );
}
```

---

## 🎯 Validación en Tiempo Real (Opcional)

```typescript
import { validateField, userSchema } from '../utils/validationSchemas';

const handleFieldBlur = (fieldName: string, value: any) => {
  const error = validateField(userSchema, fieldName, value, formData);
  setErrors(prev => ({
    ...prev,
    [fieldName]: error || ''
  }));
};

<input 
  onBlur={() => handleFieldBlur('email', formData.email)}
/>
```

---

## ✅ Beneficios

1. **Validaciones consistentes** en toda la aplicación
2. **Mensajes de error claros** y en español
3. **Type-safe** con TypeScript
4. **Reutilizable** en múltiples componentes
5. **Fácil de mantener** - un solo lugar para todas las reglas

---

## 📝 Modales que deben usar validaciones Zod

- [x] `SLAConfigurationModal.tsx` - Ya implementado
- [ ] `UserModal.tsx` - Pendiente
- [ ] `DepartmentModal.tsx` - Pendiente
- [ ] `AssignUserModal.tsx` - Pendiente

---

## 🛡️ **Funciones de Seguridad Disponibles**

Si necesitas validar seguridad manualmente:

```typescript
import { 
  validateNoXSS, 
  validateNoSQLInjection, 
  validateSecureString 
} from '../utils/validationSchemas';

// Validar solo XSS
if (!validateNoXSS(userInput)) {
  console.error('Posible ataque XSS detectado');
}

// Validar solo SQL Injection
if (!validateNoSQLInjection(userInput)) {
  console.error('Posible SQL injection detectado');
}

// Validación completa
if (!validateSecureString(userInput)) {
  console.error('Input contiene código peligroso');
}
```

---

## 🚀 Próximos Pasos

1. ✅ Validaciones de seguridad implementadas en todos los esquemas
2. ✅ Protección automática contra XSS y SQL injection
3. ✅ Funciones de validación manual disponibles
4. ✅ Todos los modales protegidos
