import prisma from '../config/database';

/**
 * Script para migrar datos de department_users a la nueva estructura
 * Ejecutar una sola vez después de la migración de schema
 */
async function migrateDepartmentUsers() {
  try {
    console.log('Iniciando migración de department_users...');

    // Obtener todos los registros de department_users
    const departmentUsers = await prisma.departmentUser.findMany({
      include: {
        user: true,
        department: true
      }
    });

    console.log(`Encontrados ${departmentUsers.length} registros para migrar`);

    let migrated = 0;
    let skipped = 0;

    for (const du of departmentUsers) {
      // Verificar si el usuario ya tiene departamento asignado
      if (du.user.departmentId) {
        console.log(`Usuario ${du.user.email} ya tiene departamento asignado, omitiendo...`);
        skipped++;
        continue;
      }

      // Actualizar usuario con departamento y rol
      await prisma.user.update({
        where: { id: du.userId },
        data: {
          departmentId: du.departmentId,
          departmentRole: du.role
        }
      });

      migrated++;
      console.log(`✓ Migrado: ${du.user.email} → ${du.department.name} (${du.role})`);
    }

    console.log('\n=== Resumen de migración ===');
    console.log(`Total registros: ${departmentUsers.length}`);
    console.log(`Migrados: ${migrated}`);
    console.log(`Omitidos: ${skipped}`);
    console.log('Migración completada exitosamente!');

  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateDepartmentUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
