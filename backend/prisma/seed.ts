import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { fieldTypesSeed } from './seeds/fieldTypes.seed';
import { validationRulesSeed } from './seeds/validationRules.seed';
import { slaConfigurationsSeed } from './seeds/slaConfigurations.seed';
import { emailTemplatesSeed } from './seeds/emailTemplates.seed';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // FASE 2: Catálogo de Tipos de Campos y SLA
    await fieldTypesSeed(prisma);
    await validationRulesSeed(prisma);
    await slaConfigurationsSeed(prisma);

    // FASE 4: Email Templates para Notificaciones
    await emailTemplatesSeed(prisma);
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
