import { env } from './config.js';
import { initializeDatabase } from './database/schema.js';
import { seedReferenceData } from './database/seed.js';
import { startBackgroundJobs } from './utils/backgroundJobs.js';
import { logger } from './utils/logger.js';

async function bootstrapWorker(): Promise<void> {
  await initializeDatabase();
  await seedReferenceData();

  if (!env.startBackgroundJobs) {
    logger.info('Worker exiting: START_BACKGROUND_JOBS is false');
    return;
  }

  startBackgroundJobs();
}

if (!env.isTest) {
  void bootstrapWorker().catch((error: Error) => {
    logger.error('Worker bootstrap failed', { error: error.message });
    process.exitCode = 1;
  });
}

export { bootstrapWorker };
