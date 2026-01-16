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
  FiDroplet
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
  color: FiDroplet
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
  console.log('FieldPalette received fieldTypes:', fieldTypes);
  console.log('FieldPalette fieldTypes length:', fieldTypes?.length);
  
  if (!fieldTypes || fieldTypes.length === 0) {
    console.log('FieldPalette: No field types available');
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

  const categories = Array.from(new Set(fieldTypes.map(ft => ft.category)));
  console.log('FieldPalette categories:', categories);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-3 flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Tipos de Campos
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {categories.map(category => {
          const categoryFields = fieldTypes.filter(ft => ft.category === category);
          
          return (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {category}
              </h4>
              <div className="space-y-1.5">
                {categoryFields.map(fieldType => (
                  <DraggableFieldType key={fieldType.id} fieldType={fieldType} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
