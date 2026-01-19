import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiTrash2, FiEdit2, FiMenu, FiEye, FiEyeOff } from 'react-icons/fi';
import { FormField } from '../../services/forms.service';

interface BuilderCanvasProps {
  fields: FormField[];
  onEditField: (field: FormField) => void;
  onDeleteField: (fieldId: string) => void;
  onToggleVisibility: (fieldId: string) => void;
  isDraggingFromPalette?: boolean;
}

function SortableField({ 
  field, 
  onEdit, 
  onDelete, 
  onToggleVisibility 
}: { 
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {field.label}
            </h4>
            {field.isRequired && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                Requerido
              </span>
            )}
            {!field.isVisible && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                Oculto
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{field.fieldType?.name || 'Campo'}</span>
            {field.columnSpan && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">
                {field.columnSpan === 3 ? '100%' : field.columnSpan === 2 ? '50%' : '33%'}
              </span>
            )}
            {field.placeholder && <span>• {field.placeholder}</span>}
          </div>
          
          {field.helpText && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {field.helpText}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleVisibility}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={field.isVisible ? 'Ocultar campo' : 'Mostrar campo'}
          >
            {field.isVisible ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar campo"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Eliminar campo"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuilderCanvas({ 
  fields, 
  onEditField, 
  onDeleteField,
  onToggleVisibility,
  isDraggingFromPalette = false
}: BuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'builder-canvas',
  });

  // Iluminar cuando isOver es true O cuando se está arrastrando desde la paleta
  const shouldHighlight = isOver || isDraggingFromPalette;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 overflow-y-auto min-h-full ${
        shouldHighlight ? 'bg-purple-50 dark:bg-purple-900/10' : 'bg-white dark:bg-gray-800'
      } transition-colors`}
    >
      <div className="min-h-full">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <FiEdit2 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Comienza a construir tu formulario
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Arrastra campos desde la paleta de la izquierda para agregar campos a tu formulario
            </p>
          </div>
        ) : (
          <div className="pb-32">
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map(field => (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={() => onEditField(field)}
                  onDelete={() => onDeleteField(field.id)}
                  onToggleVisibility={() => onToggleVisibility(field.id)}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  );
}
