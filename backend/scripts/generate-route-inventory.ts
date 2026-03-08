import fs from 'fs';
import path from 'path';

const backendRoot = process.cwd();
const workspaceRoot = path.resolve(backendRoot, '..');
const appFile = path.join(workspaceRoot, 'web-app', 'src', 'App.tsx');
const facilityNav = path.join(workspaceRoot, 'web-app', 'src', 'components', 'Sidebar.tsx');
const doctorNav = path.join(workspaceRoot, 'web-app', 'src', 'components', 'doctor', 'DoctorLayout.tsx');
const adminNav = path.join(workspaceRoot, 'web-app', 'src', 'components', 'admin', 'AdminLayout.tsx');

function extractRoutes(content: string): string[] {
  const matches = [...content.matchAll(/path=\"([^\"]+)\"/g)];
  return [...new Set(matches.map((m) => m[1]))].sort();
}

function extractNavItems(content: string): { name: string; path: string }[] {
  const matches = [...content.matchAll(/\{\s*name:\s*'([^']+)'[^}]*path:\s*'([^']+)'\s*\}/g)];
  return matches.map((m) => ({ name: m[1], path: m[2] }));
}

const app = fs.readFileSync(appFile, 'utf8');
const facility = fs.readFileSync(facilityNav, 'utf8');
const doctor = fs.readFileSync(doctorNav, 'utf8');
const admin = fs.readFileSync(adminNav, 'utf8');

const report = [
  '# Route and Navigation Inventory',
  '',
  '## App Routes',
  ...extractRoutes(app).map((r) => `- ${r}`),
  '',
  '## Facility Navigation',
  ...extractNavItems(facility).map((i) => `- ${i.name}: ${i.path}`),
  '',
  '## Doctor Navigation',
  ...extractNavItems(doctor).map((i) => `- ${i.name}: ${i.path}`),
  '',
  '## Admin Navigation',
  ...extractNavItems(admin).map((i) => `- ${i.name}: ${i.path}`),
  '',
].join('\n');

const out = path.join(backendRoot, 'data', 'route_inventory.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, report);
console.log(`Route inventory generated: ${out}`);
