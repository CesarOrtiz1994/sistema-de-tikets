import { PrismaClient, FieldCategory } from '@prisma/client';

export const fieldTypesSeed = async (prisma: PrismaClient) => {

  const fieldTypes = [
    // ============================================
    // CATEGORÍA: TEXTO
    // ============================================
    {
      name: 'TEXT',
      label: 'Texto corto',
      category: FieldCategory.TEXT,
      description: 'Campo de texto de una línea',
      icon: 'FiType',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'PATTERN'],
      componentType: 'input',
      inputProps: { type: 'text' }
    },
    {
      name: 'TEXTAREA',
      label: 'Texto largo',
      category: FieldCategory.TEXT,
      description: 'Campo de texto multilínea',
      icon: 'FiAlignLeft',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH'],
      componentType: 'textarea',
      inputProps: { rows: 4 }
    },
    {
      name: 'EMAIL',
      label: 'Email',
      category: FieldCategory.TEXT,
      description: 'Campo de correo electrónico',
      icon: 'FiMail',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'EMAIL'],
      componentType: 'input',
      inputProps: { type: 'email' }
    },
    {
      name: 'PHONE',
      label: 'Teléfono',
      category: FieldCategory.TEXT,
      description: 'Campo de número telefónico',
      icon: 'FiPhone',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'PHONE', 'PATTERN'],
      componentType: 'input',
      inputProps: { type: 'tel' }
    },
    {
      name: 'URL',
      label: 'URL',
      category: FieldCategory.TEXT,
      description: 'Campo de dirección web',
      icon: 'FiLink',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'URL'],
      componentType: 'input',
      inputProps: { type: 'url' }
    },

    // ============================================
    // CATEGORÍA: NÚMEROS
    // ============================================
    {
      name: 'NUMBER',
      label: 'Número',
      category: FieldCategory.NUMBER,
      description: 'Campo numérico',
      icon: 'FiHash',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'MIN_VALUE', 'MAX_VALUE'],
      componentType: 'input',
      inputProps: { type: 'number' }
    },
    {
      name: 'RATING',
      label: 'Calificación',
      category: FieldCategory.NUMBER,
      description: 'Campo de calificación con estrellas',
      icon: 'FiStar',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'rating',
      inputProps: { max: 5 }
    },
    {
      name: 'CURRENCY',
      label: 'Moneda',
      category: FieldCategory.NUMBER,
      description: 'Campo de cantidad monetaria',
      icon: 'FiDollarSign',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'MIN_VALUE', 'MAX_VALUE'],
      componentType: 'input',
      inputProps: { type: 'number', step: '0.01', prefix: '$' }
    },

    // ============================================
    // CATEGORÍA: SELECCIÓN
    // ============================================
    {
      name: 'SELECT',
      label: 'Lista desplegable',
      category: FieldCategory.SELECTION,
      description: 'Selección única de una lista',
      icon: 'FiChevronDown',
      hasOptions: true,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'select',
      inputProps: {}
    },
    {
      name: 'MULTISELECT',
      label: 'Selección múltiple',
      category: FieldCategory.SELECTION,
      description: 'Selección múltiple de una lista',
      icon: 'FiList',
      hasOptions: true,
      allowMultiple: true,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'multiselect',
      inputProps: {}
    },
    {
      name: 'RADIO',
      label: 'Botones de opción',
      category: FieldCategory.SELECTION,
      description: 'Selección única con botones',
      icon: 'FiCircle',
      hasOptions: true,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'radio',
      inputProps: {}
    },
    {
      name: 'CHECKBOX',
      label: 'Casillas de verificación',
      category: FieldCategory.SELECTION,
      description: 'Selección múltiple con casillas',
      icon: 'FiCheckSquare',
      hasOptions: true,
      allowMultiple: true,
      hasPlaceholder: false,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'checkbox',
      inputProps: {}
    },
    {
      name: 'TOGGLE',
      label: 'Interruptor',
      category: FieldCategory.SELECTION,
      description: 'Interruptor de encendido/apagado',
      icon: 'FiToggleLeft',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: true,
      availableValidations: [],
      componentType: 'toggle',
      inputProps: {}
    },

    // ============================================
    // CATEGORÍA: FECHA
    // ============================================
    {
      name: 'DATE',
      label: 'Fecha',
      category: FieldCategory.DATE,
      description: 'Selector de fecha',
      icon: 'FiCalendar',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'date',
      inputProps: { type: 'date' }
    },
    {
      name: 'TIME',
      label: 'Hora',
      category: FieldCategory.DATE,
      description: 'Selector de hora',
      icon: 'FiClock',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'time',
      inputProps: { type: 'time' }
    },
    {
      name: 'DATETIME',
      label: 'Fecha y hora',
      category: FieldCategory.DATE,
      description: 'Selector de fecha y hora',
      icon: 'FiCalendar',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED'],
      componentType: 'datetime',
      inputProps: { type: 'datetime-local' }
    },
    {
      name: 'DATERANGE',
      label: 'Rango de fechas',
      category: FieldCategory.DATE,
      description: 'Selector de rango de fechas',
      icon: 'FiCalendar',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: false,
      availableValidations: ['REQUIRED'],
      componentType: 'daterange',
      inputProps: {}
    },

    // ============================================
    // CATEGORÍA: ARCHIVO
    // ============================================
    {
      name: 'FILE',
      label: 'Archivo',
      category: FieldCategory.FILE,
      description: 'Carga de archivo',
      icon: 'FiFile',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: false,
      availableValidations: ['REQUIRED'],
      componentType: 'file',
      inputProps: { accept: '*/*' }
    },
    {
      name: 'IMAGE',
      label: 'Imagen',
      category: FieldCategory.FILE,
      description: 'Carga de imagen',
      icon: 'FiImage',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: false,
      availableValidations: ['REQUIRED'],
      componentType: 'file',
      inputProps: { accept: 'image/*' }
    },
    {
      name: 'MULTIFILE',
      label: 'Múltiples archivos',
      category: FieldCategory.FILE,
      description: 'Carga de múltiples archivos',
      icon: 'FiFileText',
      hasOptions: false,
      allowMultiple: true,
      hasPlaceholder: false,
      hasDefaultValue: false,
      availableValidations: ['REQUIRED'],
      componentType: 'file',
      inputProps: { accept: '*/*', multiple: true }
    },

    // ============================================
    // CATEGORÍA: AVANZADO
    // ============================================
    {
      name: 'FIRMA',
      label: 'Firma',
      category: FieldCategory.ADVANCED,
      description: 'Campo de firma digital',
      icon: 'FiEdit3',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: false,
      availableValidations: ['REQUIRED'],
      componentType: 'signature',
      inputProps: {}
    },
    {
      name: 'LOCATION',
      label: 'Ubicación',
      category: FieldCategory.ADVANCED,
      description: 'Selector de ubicación en mapa',
      icon: 'FiMapPin',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: false,
      availableValidations: ['REQUIRED'],
      componentType: 'location',
      inputProps: {}
    },
    {
      name: 'COLOR',
      label: 'Color',
      category: FieldCategory.ADVANCED,
      description: 'Selector de color con preview',
      icon: 'FiDroplet',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: true,
      hasDefaultValue: true,
      availableValidations: ['REQUIRED', 'PATTERN'],
      componentType: 'color',
      inputProps: {
        format: 'hex',
        showPreview: true,
        presetColors: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
          '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
        ]
      }
    },
    {
      name: 'SECTION_TITLE',
      label: 'Título de sección',
      category: FieldCategory.ADVANCED,
      description: 'Título para organizar el formulario en secciones',
      icon: 'FiType',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: false,
      availableValidations: [],
      componentType: 'section-title',
      inputProps: {}
    },
    {
      name: 'SECTION_DIVIDER',
      label: 'Divisor de sección',
      category: FieldCategory.ADVANCED,
      description: 'Línea divisoria para separar secciones del formulario',
      icon: 'FiMinus',
      hasOptions: false,
      allowMultiple: false,
      hasPlaceholder: false,
      hasDefaultValue: false,
      availableValidations: [],
      componentType: 'section-divider',
      inputProps: {}
    }
  ];

  for (const fieldType of fieldTypes) {
    await prisma.fieldType.upsert({
      where: { name: fieldType.name },
      update: fieldType,
      create: fieldType
    });
  }

};
