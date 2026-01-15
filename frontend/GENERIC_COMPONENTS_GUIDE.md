# 📦 Guía de Componentes Genéricos

## 🎯 Componentes Disponibles

Esta guía documenta todos los componentes genéricos reutilizables del proyecto.

---

## 1. PageHeader

**Propósito:** Header consistente para todas las páginas con título, descripción y acción opcional.

### Props
```typescript
interface PageHeaderProps {
  title: string;              // Título principal de la página
  description?: string;       // Descripción opcional
  action?: ReactNode;        // Botón o acción opcional (ej: "Nuevo Usuario")
}
```

### Ejemplo de Uso
```tsx
import PageHeader from '../components/PageHeader';
import { FiPlus } from 'react-icons/fi';

<PageHeader
  title="Gestión de Usuarios"
  description="Administra usuarios y sus roles en el sistema"
  action={
    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl">
      <FiPlus />
      Nuevo Usuario
    </button>
  }
/>
```

---

## 2. Card

**Propósito:** Contenedor genérico con fondo, sombra y modo oscuro para agrupar contenido.

### Props
```typescript
interface CardProps {
  children: ReactNode;        // Contenido del card
  className?: string;         // Clases CSS adicionales
  padding?: 'none' | 'sm' | 'md' | 'lg';  // Tamaño del padding
  noBorder?: boolean;         // Ocultar borde
}
```

### Ejemplo de Uso
```tsx
import Card from '../components/Card';

// Card básico
<Card>
  <h3>Título</h3>
  <p>Contenido</p>
</Card>

// Card con padding personalizado
<Card padding="lg">
  <h3>Título con más espacio</h3>
</Card>

// Card sin padding (para tablas)
<Card padding="none">
  <table>...</table>
</Card>
```

---

## 3. StatCard

**Propósito:** Tarjeta de estadística con valor, label, icono y tendencia opcional.

### Props
```typescript
interface StatCardProps {
  label: string;              // Label de la estadística
  value: string | number;     // Valor a mostrar
  icon: IconType;            // Icono de react-icons
  iconColor?: string;        // Color del icono (default: text-blue-500)
  valueColor?: string;       // Color del valor
  trend?: {                  // Tendencia opcional
    value: string;
    isPositive: boolean;
  };
}
```

### Ejemplo de Uso
```tsx
import StatCard from '../components/StatCard';
import { FiUsers, FiCheckCircle } from 'react-icons/fi';

// Stat básico
<StatCard
  label="Total Usuarios"
  value={150}
  icon={FiUsers}
  iconColor="text-blue-500"
/>

// Stat con tendencia
<StatCard
  label="Usuarios Activos"
  value={120}
  icon={FiCheckCircle}
  iconColor="text-green-500"
  valueColor="text-green-600"
  trend={{ value: '+12%', isPositive: true }}
/>

// Grid de stats
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <StatCard label="Total" value={150} icon={FiUsers} />
  <StatCard label="Activos" value={120} icon={FiCheckCircle} iconColor="text-green-500" />
  <StatCard label="Inactivos" value={20} icon={FiXCircle} iconColor="text-orange-500" />
  <StatCard label="Eliminados" value={10} icon={FiTrash2} iconColor="text-red-500" />
</div>
```

---

## 4. LoadingSpinner

**Propósito:** Spinner de carga consistente con diferentes tamaños y opciones.

### Props
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';  // Tamaño del spinner
  color?: string;                     // Color del spinner
  text?: string;                      // Texto opcional
  fullScreen?: boolean;               // Ocupar toda la pantalla
}
```

### Ejemplo de Uso
```tsx
import LoadingSpinner from '../components/LoadingSpinner';

// Spinner básico
<LoadingSpinner />

// Spinner pequeño sin texto
<LoadingSpinner size="sm" text="" />

// Spinner grande con texto personalizado
<LoadingSpinner 
  size="lg" 
  text="Cargando datos..." 
  color="border-blue-600"
/>

// Spinner de pantalla completa
<LoadingSpinner fullScreen />

// En una página
{loading ? (
  <LoadingSpinner />
) : (
  <div>Contenido</div>
)}
```

---

## 5. EmptyState

**Propósito:** Estado vacío consistente cuando no hay datos para mostrar.

### Props
```typescript
interface EmptyStateProps {
  icon: IconType;            // Icono de react-icons
  title: string;             // Título del estado vacío
  description?: string;      // Descripción opcional
  action?: ReactNode;        // Acción opcional (botón)
}
```

### Ejemplo de Uso
```tsx
import EmptyState from '../components/EmptyState';
import { FiUsers, FiBriefcase } from 'react-icons/fi';

// Estado vacío básico
<EmptyState
  icon={FiUsers}
  title="No hay usuarios"
  description="No se encontraron usuarios con los filtros aplicados"
/>

// Con acción
<EmptyState
  icon={FiBriefcase}
  title="No hay departamentos"
  description="Comienza creando tu primer departamento"
  action={
    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
      Crear Departamento
    </button>
  }
/>

// En DataTable (ya integrado)
{data.length === 0 ? (
  <EmptyState
    icon={FiAlertCircle}
    title="Sin resultados"
    description="Intenta ajustar los filtros"
  />
) : (
  <table>...</table>
)}
```

---

## 6. SearchInput

**Propósito:** Input de búsqueda consistente con icono y estilos unificados.

### Props
```typescript
interface SearchInputProps {
  value: string;              // Valor del input
  onChange: (value: string) => void;  // Callback al cambiar
  placeholder?: string;       // Placeholder
  className?: string;         // Clases adicionales
}
```

### Ejemplo de Uso
```tsx
import SearchInput from '../components/SearchInput';

const [search, setSearch] = useState('');

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Buscar usuarios..."
/>

// Con ancho completo
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar departamentos..."
  className="w-full"
/>

// En un grid de filtros
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <SearchInput
    value={search}
    onChange={setSearch}
    placeholder="Buscar..."
  />
  <select>...</select>
  <select>...</select>
</div>
```

---

## 7. Badge

**Propósito:** Badges/etiquetas consistentes para estados, roles, etc.

### Props
```typescript
interface BadgeProps {
  children: ReactNode;        // Contenido del badge
  variant?: BadgeVariant;     // Variante de color
  size?: 'sm' | 'md' | 'lg';  // Tamaño
  className?: string;         // Clases adicionales
}

type BadgeVariant = 
  | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
  | 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'orange';
```

### Ejemplo de Uso
```tsx
import Badge from '../components/Badge';

// Badges básicos
<Badge variant="success">Activo</Badge>
<Badge variant="danger">Inactivo</Badge>
<Badge variant="primary">Admin</Badge>

// Diferentes tamaños
<Badge size="sm" variant="info">Pequeño</Badge>
<Badge size="md" variant="warning">Mediano</Badge>
<Badge size="lg" variant="success">Grande</Badge>

// En una tabla
<td>
  <Badge variant={user.isActive ? 'success' : 'danger'}>
    {user.isActive ? 'Activo' : 'Inactivo'}
  </Badge>
</td>

// Roles
<Badge variant="purple">Super Admin</Badge>
<Badge variant="blue">Admin Departamento</Badge>
<Badge variant="gray">Subordinado</Badge>
<Badge variant="green">Solicitante</Badge>

// Estados de tickets
<Badge variant="yellow">Pendiente</Badge>
<Badge variant="blue">En Proceso</Badge>
<Badge variant="green">Resuelto</Badge>
<Badge variant="red">Cerrado</Badge>
```

---

## 🎨 Guía de Variantes de Badge

| Variante | Uso Recomendado |
|----------|-----------------|
| `primary` / `purple` | Roles principales, destacados |
| `success` / `green` | Estados activos, completados |
| `warning` / `yellow` | Advertencias, pendientes |
| `danger` / `red` | Errores, eliminados, críticos |
| `info` / `blue` | Información, en proceso |
| `gray` | Neutral, inactivo |
| `orange` | Intermedio, en revisión |

---

## 💡 Patrones de Uso Comunes

### Página Completa con Componentes Genéricos
```tsx
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchInput from '../components/SearchInput';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { FiPlus, FiUsers } from 'react-icons/fi';

export default function MyPage() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Página"
        description="Descripción de la página"
        action={
          <button className="...">
            <FiPlus /> Nuevo
          </button>
        }
      />

      <Card>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar..."
        />
      </Card>

      {data.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="No hay datos"
          description="Comienza agregando elementos"
        />
      ) : (
        <>
          <DataTable data={data} columns={...} />
          <Pagination currentPage={1} totalPages={5} onPageChange={...} />
        </>
      )}
    </div>
  );
}
```

---

## 🚀 Beneficios

1. ✅ **Consistencia visual** - Todos los componentes se ven igual
2. ✅ **Modo oscuro garantizado** - Todos incluyen dark mode
3. ✅ **Menos código** - Reutilización máxima
4. ✅ **Mantenimiento fácil** - Cambios en un solo lugar
5. ✅ **Type-safe** - TypeScript completo
6. ✅ **Desarrollo rápido** - Componentes listos para usar

---

**¡Usa estos componentes en todas las páginas nuevas para mantener la consistencia!** 🎨
