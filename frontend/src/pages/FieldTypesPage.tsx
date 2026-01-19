import { useState, useEffect } from 'react';
import { FiType, FiHash, FiList, FiCalendar, FiFile, FiCode } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import api from '../services/api';
import { toast } from 'sonner';

interface FieldType {
  id: string;
  name: string;
  label: string;
  category: 'TEXT' | 'NUMBER' | 'SELECTION' | 'DATE' | 'FILE' | 'ADVANCED';
  description: string | null;
  icon: string | null;
  hasOptions: boolean;
  allowMultiple: boolean;
  componentType: string;
  isActive: boolean;
}

const categoryIcons = {
  TEXT: FiType,
  NUMBER: FiHash,
  SELECTION: FiList,
  DATE: FiCalendar,
  FILE: FiFile,
  ADVANCED: FiCode
};

const categoryColors = {
  TEXT: 'blue',
  NUMBER: 'green',
  SELECTION: 'purple',
  DATE: 'orange',
  FILE: 'red',
  ADVANCED: 'gray'
} as const;

const categoryLabels = {
  TEXT: 'Texto',
  NUMBER: 'Números',
  SELECTION: 'Selección',
  DATE: 'Fecha/Hora',
  FILE: 'Archivos',
  ADVANCED: 'Avanzado'
};

export default function FieldTypesPage() {
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchFieldTypes();
  }, [selectedCategory]);

  const fetchFieldTypes = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await api.get('/api/field-types', { params });
      setFieldTypes(response.data);
    } catch (error) {
      console.error('Error fetching field types:', error);
      toast.error('Error al cargar tipos de campos');
    } finally {
      setLoading(false);
    }
  };

  const groupedFieldTypes = fieldTypes.reduce((acc, fieldType) => {
    if (!acc[fieldType.category]) {
      acc[fieldType.category] = [];
    }
    acc[fieldType.category].push(fieldType);
    return acc;
  }, {} as Record<string, FieldType[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Campos"
        description="Catálogo de tipos de campos disponibles para formularios dinámicos"
      />

      {/* Filtros por categoría */}
      <Card>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos ({fieldTypes.length})
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = groupedFieldTypes[key]?.length || 0;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner text="Cargando tipos de campos..." />
      ) : fieldTypes.length === 0 ? (
        <EmptyState
          icon={FiType}
          title="No hay tipos de campos"
          description="No se encontraron tipos de campos para mostrar"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFieldTypes).map(([category, types]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            const color = categoryColors[category as keyof typeof categoryColors];
            
            return (
              <Card key={category}>
                <div className="mb-4 flex items-center gap-3">
                  <Icon className="text-2xl text-gray-600 dark:text-gray-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h2>
                  <Badge variant={color} size="sm">
                    {types.length} {types.length === 1 ? 'tipo' : 'tipos'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {types.map((fieldType) => (
                    <div
                      key={fieldType.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {fieldType.label}
                          </h3>
                          <code className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                            {fieldType.name}
                          </code>
                        </div>
                      </div>

                      {fieldType.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {fieldType.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {fieldType.hasOptions && (
                          <Badge variant="info" size="sm">
                            Con opciones
                          </Badge>
                        )}
                        {fieldType.allowMultiple && (
                          <Badge variant="success" size="sm">
                            Múltiple
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Componente:</span>{' '}
                          <code className="text-gray-700 dark:text-gray-300">
                            {fieldType.componentType}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
