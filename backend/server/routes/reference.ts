/**
 * Reference Data Routes - Public/read-only reference data
 */

import { Router, type Request, type Response } from 'express';
import { getDb } from '../database/schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const referenceRouter = Router();

referenceRouter.get('/provinces', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const provinces = await db.prepare('SELECT * FROM provinces ORDER BY name').all();
    res.json({ provinces });
  } catch {
    res.status(500).json({ error: 'Failed to load provinces' });
  }
}));

referenceRouter.get('/cities', asyncHandler(async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { provinceId } = req.query;
    const cities = provinceId
      ? await db.prepare('SELECT c.*, p.name as province_name FROM cities c JOIN provinces p ON c.province_id = p.id WHERE c.province_id = ? ORDER BY c.name').all(provinceId)
      : await db.prepare('SELECT c.*, p.name as province_name FROM cities c JOIN provinces p ON c.province_id = p.id ORDER BY c.name').all();
    res.json({ cities });
  } catch {
    res.status(500).json({ error: 'Failed to load cities' });
  }
}));

referenceRouter.get('/specialties', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const specialties = await db.prepare('SELECT * FROM specialties ORDER BY name').all();
    res.json({ specialties });
  } catch {
    res.status(500).json({ error: 'Failed to load specialties' });
  }
}));

referenceRouter.get('/roles', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const roles = await db.prepare('SELECT * FROM roles ORDER BY name').all();
    res.json({ roles });
  } catch {
    res.status(500).json({ error: 'Failed to load roles' });
  }
}));

referenceRouter.get('/skills', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const skills = await db.prepare('SELECT * FROM skills ORDER BY name').all();
    res.json({ skills });
  } catch {
    res.status(500).json({ error: 'Failed to load skills' });
  }
}));

referenceRouter.get('/policies', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const policies = await db.prepare(`
      SELECT key, description FROM policy_config
      WHERE key NOT LIKE 'alert_%'
      AND key NOT IN ('maintenance_mode', 'require_2fa', 'session_timeout')
      ORDER BY key
    `).all();
    res.json({ policies });
  } catch {
    res.status(500).json({ error: 'Failed to load policies' });
  }
}));
