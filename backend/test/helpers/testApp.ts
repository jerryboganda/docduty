process.env.NODE_ENV = 'test';
process.env.START_BACKGROUND_JOBS = 'false';
process.env.SEED_REFERENCE_DATA = process.env.SEED_REFERENCE_DATA || 'true';
process.env.SEED_DEMO_DATA = process.env.SEED_DEMO_DATA || 'true';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://docduty:docduty@127.0.0.1:5432/docduty_test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'docduty-test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'docduty-test-refresh-secret';

export async function loadTestApp(): Promise<any> {
  const mod = await import('../../server/index.js');
  await mod.bootstrap();
  return mod.default;
}

export async function shutdownTestApp(): Promise<void> {
  const database = await import('../../server/database/schema.js');
  await database.closeDatabase();
}
