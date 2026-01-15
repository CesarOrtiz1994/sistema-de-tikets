# 📦 Guía de Componentes Modal

## 🎯 Componentes Disponibles

### 1. `Modal` - Componente Base
Modal genérico reutilizable con modo oscuro integrado.

### 2. `ModalButtons` - Botones de Footer
Helper para botones de Cancelar/Guardar con estados de carga.

---

## 📚 Props del Modal

```typescript
interface ModalProps {
  isOpen: boolean;              // Controla si el modal está visible
  onClose: () => void;          // Función para cerrar el modal
  title?: string;               // Título del modal (opcional)
  subtitle?: string;            // Subtítulo del modal (opcional)
  children: ReactNode;          // Contenido del modal
  footer?: ReactNode;           // Footer personalizado (opcional)
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';  // Tamaño del modal
  showCloseButton?: boolean;    // Mostrar botón X (default: true)
  closeOnOverlayClick?: boolean; // Cerrar al hacer click fuera (default: true)
  className?: string;           // Clases CSS adicionales
}
```

---

## 📚 Props de ModalButtons

```typescript
interface ModalButtonsProps {
  onCancel: () => void;         // Función al cancelar
  onConfirm?: () => void;       // Función al confirmar (opcional)
  cancelText?: string;          // Texto del botón cancelar
  confirmText?: string;         // Texto del botón confirmar
  confirmIcon?: ReactNode;      // Icono del botón confirmar
  loading?: boolean;            // Estado de carga
  confirmDisabled?: boolean;    // Deshabilitar botón confirmar
  confirmType?: 'button' | 'submit'; // Tipo del botón
  variant?: 'primary' | 'danger' | 'success'; // Estilo del botón
}
```

---

## 🎨 Tamaños Disponibles

| Tamaño | Ancho Máximo | Uso Recomendado |
|--------|--------------|-----------------|
| `sm` | 448px (28rem) | Confirmaciones simples |
| `md` | 672px (42rem) | Formularios pequeños (default) |
| `lg` | 768px (48rem) | Formularios medianos |
| `xl` | 1280px (80rem) | Tablas o contenido extenso |
| `full` | 1536px (96rem) | Dashboards o vistas complejas |

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Modal Simple con Formulario

```tsx
import Modal from '../components/Modal';
import ModalButtons from '../components/ModalButtons';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ... lógica de guardado
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Crear Usuario"
      subtitle="Complete los datos del nuevo usuario"
      size="md"
      footer={
        <ModalButtons
          onCancel={() => setIsOpen(false)}
          confirmType="submit"
          confirmText="Crear"
          loading={loading}
        />
      }
    >
      <form onSubmit={handleSubmit} id="user-form">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Juan Pérez"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
```

---

### Ejemplo 2: Modal de Confirmación (Pequeño)

```tsx
import Modal from '../components/Modal';
import ModalButtons from '../components/ModalButtons';
import { FiTrash2 } from 'react-icons/fi';

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    // ... lógica de eliminación
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Eliminar Usuario"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => setIsOpen(false)}
          onConfirm={handleDelete}
          confirmText="Eliminar"
          confirmIcon={<FiTrash2 />}
          variant="danger"
          loading={loading}
        />
      }
    >
      <p className="text-gray-700 dark:text-gray-300">
        ¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.
      </p>
    </Modal>
  );
}
```

---

### Ejemplo 3: Modal Grande con Tabla

```tsx
import Modal from '../components/Modal';
import ModalButtons from '../components/ModalButtons';
import DataTable from '../components/DataTable';

function UsersListModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Usuarios del Departamento"
      subtitle="Gestiona los usuarios asignados"
      size="lg"
      footer={
        <ModalButtons
          onCancel={() => setIsOpen(false)}
          cancelText="Cerrar"
        />
      }
    >
      <DataTable
        data={users}
        columns={[
          { key: 'name', header: 'Nombre', render: (u) => u.name },
          { key: 'email', header: 'Email', render: (u) => u.email }
        ]}
        loading={false}
        emptyMessage="No hay usuarios"
      />
    </Modal>
  );
}
```

---

### Ejemplo 4: Modal sin Footer (Solo Lectura)

```tsx
import Modal from '../components/Modal';

function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Información del Sistema"
      size="md"
    >
      <div className="space-y-3">
        <p className="text-gray-700 dark:text-gray-300">
          Versión: 1.0.0
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Última actualización: 15 de enero de 2026
        </p>
      </div>
    </Modal>
  );
}
```

---

### Ejemplo 5: Modal Personalizado (Sin Header)

```tsx
import Modal from '../components/Modal';

function CustomModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton={false}
      size="md"
    >
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Éxito!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          El usuario ha sido creado correctamente
        </p>
        <button
          onClick={() => setIsOpen(false)}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Entendido
        </button>
      </div>
    </Modal>
  );
}
```

---

## ✅ Ventajas del Modal Genérico

1. ✅ **Modo oscuro garantizado** - Siempre incluido
2. ✅ **Consistencia visual** - Todos los modales se ven igual
3. ✅ **Menos código** - Reutilización máxima
4. ✅ **Mantenimiento fácil** - Cambios en un solo lugar
5. ✅ **Accesibilidad** - aria-labels y keyboard navigation
6. ✅ **Responsive** - Funciona en móviles y desktop
7. ✅ **Type-safe** - TypeScript completo

---

## 🎨 Clases CSS Comunes para Contenido

### Inputs
```tsx
className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
```

### Labels
```tsx
className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
```

### Selects
```tsx
className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
```

### Textarea
```tsx
className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
```

### Mensajes de Error
```tsx
className="mt-1 text-sm text-red-600 dark:text-red-400"
```

### Textos de Ayuda
```tsx
className="mt-1 text-xs text-gray-500 dark:text-gray-400"
```

---

## 🔄 Migración de Modales Existentes

Para migrar un modal existente al componente genérico:

1. Importar `Modal` y `ModalButtons`
2. Reemplazar el `div` del overlay por `<Modal>`
3. Mover el contenido del header a las props `title` y `subtitle`
4. Mover el contenido del body a `children`
5. Mover los botones del footer a `<ModalButtons>`

**Antes:**
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50...">
  <div className="bg-white dark:bg-gray-800...">
    <div className="flex items-center justify-between p-6 border-b...">
      <h2>Título</h2>
      <button onClick={onClose}><FiX /></button>
    </div>
    <div className="p-6">{/* contenido */}</div>
    <div className="flex justify-end p-6 border-t...">
      <button>Cancelar</button>
      <button>Guardar</button>
    </div>
  </div>
</div>
```

**Después:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Título"
  footer={<ModalButtons onCancel={onClose} onConfirm={handleSave} />}
>
  {/* contenido */}
</Modal>
```

---

## 🚀 Próximos Pasos

1. Usar `Modal` para todos los nuevos modales
2. Opcionalmente refactorizar modales existentes
3. Extender con más variantes si es necesario

**¡Disfruta de modales consistentes y con modo oscuro garantizado!** 🎉
