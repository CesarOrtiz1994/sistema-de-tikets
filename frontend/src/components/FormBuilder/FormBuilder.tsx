import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import FieldPalette from './FieldPalette';
import BuilderCanvas from './BuilderCanvas';
import FieldEditor from './FieldEditor';
import { FormField, formsService } from '../../services/forms.service';
import { fieldTypesService, FieldType } from '../../services/fieldTypes.service';
import LoadingSpinner from '../common/LoadingSpinner';

interface FormBuilderProps {
  formId: string;
}

export default function FormBuilder({ formId }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);

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
    setIsDraggingFromPalette(event.active.id.toString().startsWith('palette-'));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    setIsDraggingFromPalette(false);
    const { active, over } = event;

    console.log('handleDragEnd - active:', active.id, 'over:', over?.id);

    if (!over) {
      console.log('handleDragEnd - no over target');
      return;
    }

    if (active.id.toString().startsWith('palette-')) {
      const fieldType = active.data.current?.fieldType;
      console.log('handleDragEnd - fieldType:', fieldType, 'over.id:', over.id);
      // Permitir soltar sobre el canvas o sobre cualquier campo existente
      const isValidDropTarget = over.id === 'builder-canvas' || fields.some(f => f.id === over.id);
      console.log('handleDragEnd - isValidDropTarget:', isValidDropTarget);
      if (fieldType && isValidDropTarget) {
        console.log('handleDragEnd - calling handleAddField');
        await handleAddField(fieldType);
      } else {
        console.log('handleDragEnd - conditions not met for adding field');
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
    console.log('handleAddField called - fieldType:', fieldType.name, 'current fields count:', fields.length);
    try {
      const newField = await formsService.addField({
        formId,
        fieldTypeId: fieldType.id,
        label: `Nuevo ${fieldType.name}`,
        isRequired: false,
        isVisible: true,
        order: fields.length
      });

      console.log('handleAddField - newField received:', newField);
      setFields([...fields, { ...newField, fieldType }]);
      console.log('handleAddField - fields updated, new count:', fields.length + 1);
      toast.success('Campo agregado al formulario');
    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Error al agregar campo');
    }
  };

  const handleEditField = (field: FormField) => {
    console.log('handleEditField - field:', field);
    console.log('handleEditField - field.fieldType:', field.fieldType);
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleSaveField = async (updatedField: FormField) => {
    try {
      const payload = {
        label: updatedField.label,
        placeholder: updatedField.placeholder,
        helpText: updatedField.helpText,
        isRequired: updatedField.isRequired,
        isVisible: updatedField.isVisible,
        columnSpan: updatedField.columnSpan,
        validationRules: updatedField.validationRules,
        conditionalLogic: updatedField.conditionalLogic,
        options: updatedField.options,
      };
      console.log('Guardando campo con payload:', payload);
      const savedField = await formsService.updateField(updatedField.id, payload);

      setFields(fields.map(f => f.id === savedField.id ? { ...savedField, fieldType: f.fieldType } : f));
      toast.success('Campo actualizado exitosamente');
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Error al actualizar campo');
    }
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
    <>
      {/* Contador de campos */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
        </span>
      </div>

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
          isDraggingFromPalette={isDraggingFromPalette}
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

        <FieldEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingField(null);
          }}
          field={editingField}
          onSave={handleSaveField}
          allFields={fields}
        />
      </DndContext>
    </>
  );
}
