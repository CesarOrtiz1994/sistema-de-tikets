import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${fieldType.id}`,
    data: { fieldType }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = iconMap[fieldType.code] || FiType;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {fieldType.name}
        </span>
      </div>
    </div>
  );
}

export default function FieldPalette({ fieldTypes }: FieldPaletteProps) {
  const categories = Array.from(new Set(fieldTypes.map(ft => ft.category)));

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tipos de Campos
      </h3>
      
      {categories.map(category => {
        const categoryFields = fieldTypes.filter(ft => ft.category === category);
        
        return (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
              {category}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {categoryFields.map(fieldType => (
                <DraggableFieldType key={fieldType.id} fieldType={fieldType} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
