import fs from 'fs';
import path from 'path';

type RouteRecord = {
  portal: 'public' | 'facility' | 'doctor' | 'admin';
  route: string;
  component?: string;
  file?: string;
};

type InteractionSummary = {
  buttons: number;
  links: number;
  formFields: number;
  dropdowns: number;
  dialogs: number;
  clickHandlers: number;
  rowActions: number;
};

const backendRoot = process.cwd();
const workspaceRoot = path.resolve(backendRoot, '..');
const appFile = path.join(workspaceRoot, 'web-app', 'src', 'App.tsx');

function read(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function normalizePath(importPath: string): string {
  const clean = importPath.replace(/^\.\/?/, '');
  return path.join(workspaceRoot, 'web-app', 'src', `${clean}.tsx`);
}

function detectPortal(route: string): RouteRecord['portal'] {
  if (route.startsWith('/doctor')) return 'doctor';
  if (route.startsWith('/facility')) return 'facility';
  if (route.startsWith('/admin')) return 'admin';
  return 'public';
}

function parseImports(source: string): Record<string, string> {
  const map: Record<string, string> = {};
  const importRe = /import\s+([A-Za-z0-9_]+)\s+from\s+'([^']+)'/g;
  for (const m of source.matchAll(importRe)) {
    map[m[1]] = normalizePath(m[2]);
  }
  return map;
}

function joinRoute(base: string, child: string): string {
  if (!child) return base;
  if (child.startsWith('/')) return child;
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${left}/${child}`;
}

function parseRoutes(source: string, imports: Record<string, string>): RouteRecord[] {
  const routes: RouteRecord[] = [];

  // Top-level routes.
  const topRe = /<Route\s+path="([^"]+)"\s+element={<([A-Za-z0-9_]+)/g;
  for (const m of source.matchAll(topRe)) {
    const route = m[1];
    const component = m[2];
    routes.push({
      portal: detectPortal(route),
      route,
      component,
      file: imports[component],
    });
  }

  // Nested index and path routes under portal roots.
  const nestedBlockRe = /<Route\s+path="(\/(?:facility|doctor|admin))"[\s\S]*?<\/Route>/g;
  for (const blockMatch of source.matchAll(nestedBlockRe)) {
    const base = blockMatch[1];
    const block = blockMatch[0];

    const indexMatch = block.match(/<Route\s+index\s+element={<([A-Za-z0-9_]+)/);
    if (indexMatch) {
      const component = indexMatch[1];
      routes.push({
        portal: detectPortal(base),
        route: base,
        component,
        file: imports[component],
      });
    }

    const childRe = /<Route\s+path="([^"]+)"\s+element={<([A-Za-z0-9_]+)/g;
    for (const child of block.matchAll(childRe)) {
      const route = joinRoute(base, child[1]);
      const component = child[2];
      routes.push({
        portal: detectPortal(route),
        route,
        component,
        file: imports[component],
      });
    }
  }

  const dedup = new Map<string, RouteRecord>();
  for (const r of routes) dedup.set(r.route, r);
  return [...dedup.values()].sort((a, b) => a.route.localeCompare(b.route));
}

function summarizeInteractions(content: string): InteractionSummary {
  const count = (re: RegExp) => (content.match(re) || []).length;
  return {
    buttons: count(/<button(\s|>)/g),
    links: count(/<(Link|NavLink)(\s|>)/g),
    formFields: count(/<(input|textarea)(\s|>)/g),
    dropdowns: count(/<select(\s|>)/g),
    dialogs: count(/(role="dialog"|<dialog(\s|>))/g),
    clickHandlers: count(/onClick=/g),
    rowActions: count(/(View|Edit|Delete|Approve|Reject|Resolve)/g),
  };
}

function formatSummary(s: InteractionSummary): string {
  return `buttons=${s.buttons}, links=${s.links}, fields=${s.formFields}, selects=${s.dropdowns}, dialogs=${s.dialogs}, onClick=${s.clickHandlers}, rowActions=${s.rowActions}`;
}

function generate(): string {
  const app = read(appFile);
  const imports = parseImports(app);
  const routes = parseRoutes(app, imports);

  const lines: string[] = [
    '# Portal Interaction Inventory',
    '',
    'Generated from source route/page analysis (static).',
    '',
  ];

  for (const portal of ['doctor', 'facility', 'admin', 'public'] as const) {
    lines.push(`## ${portal[0].toUpperCase()}${portal.slice(1)} Routes`);
    const items = routes.filter((r) => r.portal === portal);
    for (const item of items) {
      if (item.file && fs.existsSync(item.file)) {
        const summary = summarizeInteractions(read(item.file));
        lines.push(`- ${item.route} -> ${path.relative(workspaceRoot, item.file)} (${formatSummary(summary)})`);
      } else {
        lines.push(`- ${item.route} -> unresolved component (${item.component || 'n/a'})`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

const out = path.join(backendRoot, 'data', 'interaction_inventory.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, generate(), 'utf8');
console.log(`Interaction inventory generated: ${out}`);
