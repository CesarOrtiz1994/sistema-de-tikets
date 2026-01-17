import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { FiCheck } from 'react-icons/fi';
import FieldPalette from './FieldPalette';
import BuilderCanvas from './BuilderCanvas';
import FieldEditor from './FieldEditor';
import ConfirmDialog from '../ConfirmDialog';
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
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

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
      const savedField = await formsService.updateField(updatedField.id, {
        label: updatedField.label,
        placeholder: updatedField.placeholder,
        helpText: updatedField.helpText,
        isRequired: updatedField.isRequired,
        isVisible: updatedField.isVisible,
        validationRules: updatedField.validations,
      });

      setFields(fields.map(f => f.id === savedField.id ? { ...savedField, fieldType: f.fieldType, options: updatedField.options } : f));
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

  const handleActivateForm = async () => {
    if (fields.length === 0) {
      toast.error('El formulario debe tener al menos un campo para ser activado');
      return;
    }

    setShowActivateDialog(true);
  };

  const confirmActivateForm = async () => {
    setIsActivating(true);
    try {
      await formsService.activateForm(formId, false);
      toast.success('Formulario activado exitosamente');
      setShowActivateDialog(false);
      await loadData();
    } catch (error: any) {
      console.error('Error activating form:', error);
      toast.error(error.response?.data?.message || 'Error al activar formulario');
    } finally {
      setIsActivating(false);
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
      {/* Botones de acción */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleActivateForm}
            disabled={isActivating || fields.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <FiCheck className="w-4 h-4" />
            {isActivating ? 'Activando...' : 'Guardar y Activar'}
          </button>
        </div>
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

      <ConfirmDialog
        isOpen={showActivateDialog}
        title="Activar Formulario"
        message="¿Estás seguro de que deseas activar este formulario? Si hay otro formulario activo en este departamento, será archivado automáticamente."
        confirmText="Activar"
        cancelText="Cancelar"
        type="info"
        onConfirm={confirmActivateForm}
        onCancel={() => setShowActivateDialog(false)}
      />
    </>
  );
}
