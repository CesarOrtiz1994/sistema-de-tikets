import { PrismaClient, ValidationType } from '@prisma/client';

export const validationRulesSeed = async (prisma: PrismaClient) => {

  const validationRules = [
    {
      type: ValidationType.REQUIRED,
      name: 'Requerido',
      description: 'El campo es obligatorio',
      requiresValue: false,
      valueType: null,
      defaultErrorMessage: 'Este campo es requerido'
    },
    {
      type: ValidationType.MIN_LENGTH,
      name: 'Longitud mínima',
      description: 'El texto debe tener una longitud mínima',
      requiresValue: true,
      valueType: 'number',
      defaultErrorMessage: 'El texto debe tener al menos {value} caracteres'
    },
    {
      type: ValidationType.MAX_LENGTH,
      name: 'Longitud máxima',
      description: 'El texto debe tener una longitud máxima',
      requiresValue: true,
      valueType: 'number',
      defaultErrorMessage: 'El texto no debe exceder {value} caracteres'
    },
    {
      type: ValidationType.MIN_VALUE,
      name: 'Valor mínimo',
      description: 'El número debe ser mayor o igual a un valor',
      requiresValue: true,
      valueType: 'number',
      defaultErrorMessage: 'El valor debe ser al menos {value}'
    },
    {
      type: ValidationType.MAX_VALUE,
      name: 'Valor máximo',
      description: 'El número debe ser menor o igual a un valor',
      requiresValue: true,
      valueType: 'number',
      defaultErrorMessage: 'El valor no debe exceder {value}'
    },
    {
      type: ValidationType.PATTERN,
      name: 'Patrón',
      description: 'El texto debe coincidir con un patrón regex',
      requiresValue: true,
      valueType: 'regex',
      defaultErrorMessage: 'El formato no es válido'
    },
    {
      type: ValidationType.EMAIL,
      name: 'Email',
      description: 'El texto debe ser un email válido',
      requiresValue: false,
      valueType: null,
      defaultErrorMessage: 'Debe ser un email válido'
    },
    {
      type: ValidationType.URL,
      name: 'URL',
      description: 'El texto debe ser una URL válida',
      requiresValue: false,
      valueType: null,
      defaultErrorMessage: 'Debe ser una URL válida'
    },
    {
      type: ValidationType.PHONE,
      name: 'Teléfono',
      description: 'El texto debe ser un número telefónico válido',
      requiresValue: false,
      valueType: null,
      defaultErrorMessage: 'Debe ser un número telefónico válido'
    },
    {
      type: ValidationType.CUSTOM,
      name: 'Personalizado',
      description: 'Validación personalizada con función JavaScript',
      requiresValue: true,
      valueType: 'string',
      defaultErrorMessage: 'El valor no es válido'
    }
  ];

  for (const rule of validationRules) {
    await prisma.validationRuleCatalog.upsert({
      where: { type: rule.type },
      update: rule,
      create: rule
    });
  }

};
