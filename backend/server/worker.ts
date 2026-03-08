import { env } from './config.js';
import { initializeDatabase } from './database/schema.js';
import { seedReferenceData } from './database/seed.js';
import { startBackgroundJobs } from './utils/backgroundJobs.js';

async function bootstrapWorker(): Promise<void> {
  await initializeDatabase();
  await seedReferenceData();

  if (!env.startBackgroundJobs) {
    console.log('[DocDuty Worker] START_BACKGROUND_JOBS is false; worker exiting without scheduling jobs');
    return;
  }

  startBackgroundJobs();
}

if (!env.isTest) {
  void bootstrapWorker().catch((error: Error) => {
    console.error('[DocDuty Worker Bootstrap]', error.message);
    process.exitCode = 1;
  });
}

export { bootstrapWorker };
