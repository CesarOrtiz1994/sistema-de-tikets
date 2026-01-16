import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import FieldPalette from './FieldPalette';
import BuilderCanvas from './BuilderCanvas';
import { FormField, formsService } from '../../services/forms.service';
import { fieldTypesService, FieldType } from '../../services/fieldTypes.service';
import LoadingSpinner from '../LoadingSpinner';

interface FormBuilderProps {
  formId: string;
}

export default function FormBuilder({ formId }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [formId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formData, typesData] = await Promise.all([
        formsService.getFormById(formId),
        fieldTypesService.getFieldTypes()
      ]);
      
      console.log('Field Types loaded:', typesData);
      console.log('Field Types count:', typesData?.length);
      
      setFields(formData.fields || []);
      setFieldTypes(typesData);
    } catch (error) {
      console.error('Error loading form builder data:', error);
      toast.error('Error al cargar los datos del formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    if (active.id.toString().startsWith('palette-')) {
      const fieldType = active.data.current?.fieldType;
      if (fieldType && over.id === 'builder-canvas') {
        await handleAddField(fieldType);
      }
    } else {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);

      if (oldIndex !== newIndex) {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        const updatedFields = newFields.map((field, index) => ({
          ...field,
          order: index
        }));
        
        setFields(updatedFields);
        
        try {
          await formsService.reorderFields(
            formId,
            updatedFields.map(f => ({ id: f.id, order: f.order }))
          );
          toast.success('Campos reordenados');
        } catch (error) {
          console.error('Error reordering fields:', error);
          toast.error('Error al reordenar campos');
          setFields(fields);
        }
      }
    }
  };

  const handleAddField = async (fieldType: FieldType) => {
    try {
      const newField = await formsService.addField({
        formId,
        fieldTypeId: fieldType.id,
        label: `Nuevo ${fieldType.name}`,
        isRequired: false,
        isVisible: true,
        order: fields.length
      });

      setFields([...fields, { ...newField, fieldType }]);
      toast.success('Campo agregado al formulario');
    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Error al agregar campo');
    }
  };

  const handleEditField = (_field: FormField) => {
    toast.info('Función de edición en desarrollo');
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await formsService.deleteField(fieldId);
      setFields(fields.filter(f => f.id !== fieldId));
      toast.success('Campo eliminado');
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Error al eliminar campo');
    }
  };

  const handleToggleVisibility = async (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    try {
      const updatedField = await formsService.updateField(fieldId, {
        isVisible: !field.isVisible
      });

      setFields(fields.map(f => f.id === fieldId ? { ...f, isVisible: updatedField.isVisible } : f));
      toast.success(updatedField.isVisible ? 'Campo visible' : 'Campo oculto');
    } catch (error) {
      console.error('Error toggling field visibility:', error);
      toast.error('Error al cambiar visibilidad');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <FieldPalette fieldTypes={fieldTypes} />
        </div>
        
        <BuilderCanvas
          fields={fields}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
          onToggleVisibility={handleToggleVisibility}
        />
      </div>

      <DragOverlay>
        {activeId && activeId.toString().startsWith('palette-') ? (
          <div className="bg-white dark:bg-gray-800 border-2 border-purple-400 rounded-lg p-4 shadow-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Arrastrando campo...
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
