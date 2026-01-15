# Guía de Componentes Reutilizables

## 📊 DataTable - Componente de Tabla Genérico

Componente reutilizable para mostrar tablas de datos con diseño consistente, modo oscuro y estados de carga.

### Características:
- ✅ Diseño unificado en toda la aplicación
- ✅ Modo oscuro completo
- ✅ Estados de carga automáticos
- ✅ Mensajes de "sin datos" personalizables
- ✅ Hover en filas
- ✅ Click en filas (opcional)
- ✅ TypeScript genérico para type-safety

### Uso Básico:

```tsx
import DataTable from '../components/DataTable';
import { FiUsers } from 'react-icons/fi';

// Definir las columnas
const columns = [
  {
    key: 'name',
    header: 'Nombre',
    render: (user) => (
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {user.name}
      </div>
    )
  },
  {
    key: 'email',
    header: 'Email',
    render: (user) => (
      <div className="text-sm text-gray-500 dark:text-gray-300">
        {user.email}
      </div>
    )
  },
  {
    key: 'actions',
    header: 'Acciones',
    align: 'right',
    render: (user) => (
      <button onClick={() => handleEdit(user)}>Editar</button>
    )
  }
];

// Usar el componente
<DataTable
  data={users}
  columns={columns}
  loading={loading}
  emptyMessage="No se encontraron usuarios"
  emptyIcon={<FiUsers />}
  getRowKey={(user) => user.id}
  onRowClick={(user) => console.log('Clicked:', user)}
/>
```

### Props:

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `data` | `T[]` | ✅ | Array de datos a mostrar |
| `columns` | `Column<T>[]` | ✅ | Definición de columnas |
| `getRowKey` | `(item: T) => string` | ✅ | Función para obtener key única |
| `loading` | `boolean` | ❌ | Mostrar estado de carga |
| `emptyMessage` | `string` | ❌ | Mensaje cuando no hay datos |
| `emptyIcon` | `ReactNode` | ❌ | Icono para estado vacío |
| `onRowClick` | `(item: T) => void` | ❌ | Callback al hacer click en fila |

### Definición de Columna:

```tsx
interface Column<T> {
  key: string;              // Identificador único
  header: string;           // Texto del encabezado
  render: (item: T) => ReactNode;  // Función para renderizar celda
  align?: 'left' | 'center' | 'right';  // Alineación (default: 'left')
}
```

---

## 📄 Pagination - Componente de Paginación

Componente reutilizable para paginación consistente en todas las tablas.

### Características:
- ✅ Diseño unificado
- ✅ Modo oscuro completo
- ✅ Botones deshabilitados automáticamente
- ✅ Se oculta si solo hay 1 página

### Uso Básico:

```tsx
import Pagination from '../components/Pagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(newPage) => setPage(newPage)}
/>
```

### Props:

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `currentPage` | `number` | ✅ | Página actual (1-indexed) |
| `totalPages` | `number` | ✅ | Total de páginas |
| `onPageChange` | `(page: number) => void` | ✅ | Callback al cambiar página |

---

## 🎯 Ejemplo Completo: Página de Usuarios

```tsx
import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { FiUsers } from 'react-icons/fi';
import { usersService, User } from '../services/users.service';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.listUsers({ page, limit: 10 });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Usuario',
      render: (user: User) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {user.email}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user: User) => (
        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
          {user.roleType}
        </span>
      )
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>
      
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyMessage="No se encontraron usuarios"
        emptyIcon={<FiUsers />}
        getRowKey={(user) => user.id}
      />
      
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

---

## 🎨 Estilos Consistentes

Todos los componentes usan la misma paleta de colores:

### Modo Claro:
- Fondo tabla: `bg-white`
- Fondo header: `bg-gray-50`
- Texto header: `text-gray-500`
- Hover: `hover:bg-gray-50`
- Bordes: `border-gray-200`

### Modo Oscuro:
- Fondo tabla: `dark:bg-gray-800`
- Fondo header: `dark:bg-gray-900`
- Texto header: `dark:text-gray-300`
- Hover: `dark:hover:bg-gray-700`
- Bordes: `dark:border-gray-700`

---

## ✅ Ventajas de Usar Estos Componentes

1. **Consistencia:** Todas las tablas se ven iguales
2. **Mantenibilidad:** Un solo lugar para actualizar estilos
3. **Type-Safety:** TypeScript genérico previene errores
4. **Modo Oscuro:** Funciona automáticamente
5. **Menos Código:** Reduce duplicación
6. **Futuro:** Nuevas tablas son más fáciles de crear

---

## 📝 Notas Importantes

- **Límite de paginación:** Usar siempre `limit: 10` para consistencia
- **Loading state:** Siempre pasar el estado `loading` al componente
- **Empty state:** Personalizar mensaje e icono según el contexto
- **Row keys:** Usar IDs únicos, nunca índices del array
- **Alineación:** Headers de acciones siempre `align: 'right'`
