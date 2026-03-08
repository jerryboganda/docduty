import { closeDatabase, initializeDatabase } from '../server/database/schema.js';
import { seedReferenceData } from '../server/database/seed.js';

async function main(): Promise<void> {
  try {
    await initializeDatabase();
    await seedReferenceData();
    console.log('[db:seed] Seed completed');
  } finally {
    await closeDatabase();
  }
}

void main().catch((error: Error) => {
  console.error('[db:seed]', error.message);
  process.exitCode = 1;
});
