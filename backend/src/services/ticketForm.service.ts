import prisma from '../config/database';
import { FormStatus } from '@prisma/client';

interface CreateTicketFormData {
  departmentId: string;
  name: string;
  description?: string;
  status?: FormStatus;
  isDefault?: boolean;
}

interface UpdateTicketFormData {
  name?: string;
  description?: string;
  status?: FormStatus;
  isDefault?: boolean;
}

interface CreateFormFieldData {
  formId: string;
  fieldTypeId: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  order?: number;
  defaultValue?: string;
  validationRules?: any;
}

interface UpdateFormFieldData {
  label?: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  order?: number;
  row?: number;
  columnInRow?: number;
  columnSpan?: number;
  defaultValue?: string;
  validationRules?: any;
  options?: Array<{
    id?: string;
    label: string;
    value: string;
    order: number;
    isDefault: boolean;
  }>;
}

interface CreateFieldOptionData {
  fieldId: string;
  label: string;
  value: string;
  order?: number;
  isDefault?: boolean;
}

class TicketFormService {
  // ============================================
  // TICKET FORMS
  // ============================================

  async getDepartmentForms(departmentId: string) {
    return await prisma.ticketForm.findMany({
      where: {
        departmentId,
        deletedAt: null
      },
      include: {
        fields: {
          include: {
            fieldType: true,
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFormById(id: string) {
    return await prisma.ticketForm.findUnique({
      where: { id },
      include: {
        department: true,
        fields: {
          include: {
            fieldType: true,
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
  }

  async createForm(data: CreateTicketFormData) {
    return await prisma.ticketForm.create({
      data: {
        departmentId: data.departmentId,
        name: data.name,
        description: data.description,
        status: data.status || FormStatus.DRAFT,
        isDefault: data.isDefault || false
      },
      include: {
        department: true,
        fields: true
      }
    });
  }

  async updateForm(id: string, data: UpdateTicketFormData) {
    return await prisma.ticketForm.update({
      where: { id },
      data,
      include: {
        department: true,
        fields: {
          include: {
            fieldType: true,
            options: true
          }
        }
      }
    });
  }

  async deleteForm(id: string) {
    // Soft delete
    return await prisma.ticketForm.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
  }

  async setDefaultForm(departmentId: string, formId: string) {
    // Primero, quitar el default de todos los formularios del departamento
    await prisma.ticketForm.updateMany({
      where: {
        departmentId,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });

    // Luego, establecer el nuevo default
    return await prisma.ticketForm.update({
      where: { id: formId },
      data: {
        isDefault: true
      }
    });
  }

  async getActiveDepartmentForm(departmentId: string) {
    const activeForm = await prisma.ticketForm.findFirst({
      where: {
        departmentId,
        status: FormStatus.ACTIVE,
        deletedAt: null
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        fields: {
          where: {
            isVisible: true
          },
          include: {
            fieldType: true,
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!activeForm) {
      throw new Error('No hay formulario activo para este departamento');
    }

    return activeForm;
  }

  async activateForm(formId: string, incrementVersion: boolean = false) {
    const form = await this.getFormById(formId);
    
    if (!form) {
      throw new Error('Formulario no encontrado');
    }

    // Validar que el formulario tenga al menos un campo
    if (!form.fields || form.fields.length === 0) {
      throw new Error('El formulario debe tener al menos un campo para ser activado');
    }

    // Verificar si ya hay otro formulario activo en el departamento
    const activeForm = await prisma.ticketForm.findFirst({
      where: {
        departmentId: form.departmentId,
        status: FormStatus.ACTIVE,
        deletedAt: null,
        id: { not: formId }
      }
    });

    // Si hay otro formulario activo, archivarlo
    if (activeForm) {
      await prisma.ticketForm.update({
        where: { id: activeForm.id },
        data: {
          status: FormStatus.ARCHIVED
        }
      });
    }

    // Calcular nueva versión si es necesario
    let version = form.version || 1;
    if (incrementVersion) {
      version += 1;
    }

    // Activar el formulario
    return await prisma.ticketForm.update({
      where: { id: formId },
      data: {
        status: FormStatus.ACTIVE,
        version
      },
      include: {
        department: true,
        fields: {
          include: {
            fieldType: true,
            options: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });
  }

  // ============================================
  // FORM FIELDS
  // ============================================

  async addFieldToForm(data: CreateFormFieldData) {
    return await prisma.formField.create({
      data: {
        formId: data.formId,
        fieldTypeId: data.fieldTypeId,
        label: data.label,
        placeholder: data.placeholder,
        helpText: data.helpText,
        isRequired: data.isRequired || false,
        isVisible: data.isVisible !== false,
        order: data.order || 0,
        defaultValue: data.defaultValue,
        validationRules: data.validationRules
      },
      include: {
        fieldType: true,
        options: true
      }
    });
  }

  async updateFormField(id: string, data: UpdateFormFieldData) {
    const { options, ...fieldData } = data;

    // Si se proporcionan opciones, manejarlas en una transacción
    if (options !== undefined) {
      return await prisma.$transaction(async (tx) => {
        // Actualizar el campo
        await tx.formField.update({
          where: { id },
          data: fieldData
        });

        // Obtener opciones existentes
        const existingOptions = await tx.fieldOption.findMany({
          where: { fieldId: id }
        });

        const existingIds = existingOptions.map(opt => opt.id);
        const incomingIds = options.filter(opt => opt.id).map(opt => opt.id);

        // Eliminar opciones que ya no existen
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (toDelete.length > 0) {
          await tx.fieldOption.deleteMany({
            where: { id: { in: toDelete } }
          });
        }

        // Actualizar o crear opciones
        for (const option of options) {
          if (option.id && existingIds.includes(option.id)) {
            // Actualizar opción existente
            await tx.fieldOption.update({
              where: { id: option.id },
              data: {
                label: option.label,
                value: option.value,
                order: option.order,
                isDefault: option.isDefault
              }
            });
          } else {
            // Crear nueva opción
            await tx.fieldOption.create({
              data: {
                fieldId: id,
                label: option.label,
                value: option.value,
                order: option.order,
                isDefault: option.isDefault
              }
            });
          }
        }

        // Retornar campo actualizado con opciones
        return await tx.formField.findUnique({
          where: { id },
          include: {
            fieldType: true,
            options: {
              orderBy: { order: 'asc' }
            }
          }
        });
      });
    }

    // Si no hay opciones, solo actualizar el campo
    return await prisma.formField.update({
      where: { id },
      data: fieldData,
      include: {
        fieldType: true,
        options: true
      }
    });
  }

  async deleteFormField(id: string) {
    return await prisma.formField.delete({
      where: { id }
    });
  }

  async reorderFormFields(_formId: string, fieldOrders: { id: string; order: number }[]) {
    const updates = fieldOrders.map(({ id, order }) =>
      prisma.formField.update({
        where: { id },
        data: { order }
      })
    );

    return await prisma.$transaction(updates);
  }

  // ============================================
  // FIELD OPTIONS
  // ============================================

  async addFieldOption(data: CreateFieldOptionData) {
    return await prisma.fieldOption.create({
      data: {
        fieldId: data.fieldId,
        label: data.label,
        value: data.value,
        order: data.order || 0,
        isDefault: data.isDefault || false
      }
    });
  }

  async updateFieldOption(id: string, data: Partial<CreateFieldOptionData>) {
    return await prisma.fieldOption.update({
      where: { id },
      data
    });
  }

  async deleteFieldOption(id: string) {
    return await prisma.fieldOption.delete({
      where: { id }
    });
  }

  async bulkCreateFieldOptions(fieldId: string, options: Omit<CreateFieldOptionData, 'fieldId'>[]) {
    const data = options.map((opt, index) => ({
      fieldId,
      label: opt.label,
      value: opt.value,
      order: opt.order !== undefined ? opt.order : index,
      isDefault: opt.isDefault || false
    }));

    return await prisma.fieldOption.createMany({
      data
    });
  }

  // ============================================
  // UTILITY
  // ============================================

  async getFormStats(departmentId: string) {
    const [total, active, draft, archived] = await Promise.all([
      prisma.ticketForm.count({
        where: { departmentId, deletedAt: null }
      }),
      prisma.ticketForm.count({
        where: { departmentId, status: FormStatus.ACTIVE, deletedAt: null }
      }),
      prisma.ticketForm.count({
        where: { departmentId, status: FormStatus.DRAFT, deletedAt: null }
      }),
      prisma.ticketForm.count({
        where: { departmentId, status: FormStatus.ARCHIVED, deletedAt: null }
      })
    ]);

    return {
      total,
      active,
      draft,
      archived
    };
  }

  async duplicateForm(formId: string, newName: string) {
    const originalForm = await this.getFormById(formId);
    
    if (!originalForm) {
      throw new Error('Form not found');
    }

    // Crear el nuevo formulario
    const newForm = await prisma.ticketForm.create({
      data: {
        departmentId: originalForm.departmentId,
        name: newName,
        description: originalForm.description,
        status: FormStatus.DRAFT,
        isDefault: false
      }
    });

    // Duplicar los campos
    if (originalForm.fields.length > 0) {
      const fieldsData = originalForm.fields.map(field => ({
        formId: newForm.id,
        fieldTypeId: field.fieldTypeId,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        order: field.order,
        defaultValue: field.defaultValue,
        validationRules: field.validationRules
      }));

      await prisma.formField.createMany({
        data: fieldsData as any
      });

      // Obtener los campos creados para duplicar opciones
      const newFields = await prisma.formField.findMany({
        where: { formId: newForm.id }
      });

      // Duplicar opciones de campos
      for (let i = 0; i < originalForm.fields.length; i++) {
        const originalField = originalForm.fields[i];
        const newField = newFields[i];

        if (originalField.options.length > 0) {
          const optionsData = originalField.options.map(option => ({
            fieldId: newField.id,
            label: option.label,
            value: option.value,
            order: option.order,
            isDefault: option.isDefault
          }));

          await prisma.fieldOption.createMany({
            data: optionsData
          });
        }
      }
    }

    return await this.getFormById(newForm.id);
  }
}

export default new TicketFormService();
