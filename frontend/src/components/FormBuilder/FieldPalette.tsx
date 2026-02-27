import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  FiType, 
  FiAlignLeft, 
  FiList, 
  FiCheckSquare, 
  FiCircle,
  FiCalendar,
  FiFile,
  FiHash,
  FiMail,
  FiPhone,
  FiLink,
  FiDroplet,
  FiSearch,
  FiMinus
} from 'react-icons/fi';

interface FieldType {
  id: string;
  name: string;
  code: string;
  category: string;
  icon?: string;
}

interface FieldPaletteProps {
  fieldTypes: FieldType[];
}

const iconMap: Record<string, any> = {
  text: FiType,
  textarea: FiAlignLeft,
  select: FiList,
  checkbox: FiCheckSquare,
  radio: FiCircle,
  date: FiCalendar,
  file: FiFile,
  number: FiHash,
  email: FiMail,
  phone: FiPhone,
  url: FiLink,
  color: FiDroplet,
  'section-title': FiType,
  'section-divider': FiMinus
};

function DraggableFieldType({ fieldType }: { fieldType: FieldType }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${fieldType.id}`,
    data: { fieldType }
  });

  const Icon = iconMap[fieldType.code] || FiType;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500 transition-all"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
          {fieldType.name}
        </span>
      </div>
    </div>
  );
}

export default function FieldPalette({ fieldTypes }: FieldPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Obtener categorías únicas
  const categories = useMemo(() => {
    if (!fieldTypes) return [];
    const uniqueCategories = Array.from(new Set(fieldTypes.map(ft => ft.category)));
    return ['all', ...uniqueCategories];
  }, [fieldTypes]);

  // Filtrar campos por búsqueda y categoría
  const filteredFieldTypes = useMemo(() => {
    if (!fieldTypes) return [];
    
    return fieldTypes.filter(fieldType => {
      const matchesSearch = fieldType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fieldType.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || fieldType.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [fieldTypes, searchTerm, selectedCategory]);

  // Agrupar por categoría
  const groupedFieldTypes = useMemo(() => {
    const groups: Record<string, FieldType[]> = {};
    
    filteredFieldTypes.forEach(fieldType => {
      if (!groups[fieldType.category]) {
        groups[fieldType.category] = [];
      }
      groups[fieldType.category].push(fieldType);
    });
    
    return groups;
  }, [filteredFieldTypes]);
  
  if (!fieldTypes || fieldTypes.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-3 h-full">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Tipos de Campos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay tipos de campos disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-3 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Tipos de Campos
        </h3>
        
        {/* Búsqueda */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar campo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Filtro por categoría */}
        <div className="flex gap-1 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                selectedCategory === category
                  ? 'bg-brand-gradient text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category === 'all' ? 'Todos' : category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Lista de campos */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filteredFieldTypes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No se encontraron campos
            </p>
          </div>
        ) : (
          Object.entries(groupedFieldTypes).map(([category, fields]) => (
            <div key={category} className="mb-4 mt-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {category}
              </h4>
              <div className="space-y-1.5">
                {fields.map(fieldType => (
                  <DraggableFieldType key={fieldType.id} fieldType={fieldType} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
