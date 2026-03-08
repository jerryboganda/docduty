import fs from 'fs';
import path from 'path';
import { chromium, firefox, type BrowserType, type Page } from 'playwright';

type Role = 'doctor' | 'facility_admin' | 'platform_admin';
type BrowserName = 'chromium' | 'firefox';

type AuditIssue = {
  browser: BrowserName;
  role: Role;
  route: string;
  type: 'console-error' | 'request-failed' | 'interaction-failed';
  detail: string;
};

type RouteResult = {
  route: string;
  headingFound: boolean;
  clickableChecked: number;
  clickableFailed: number;
  inputChecked: number;
  inputFailed: number;
};

type RoleResult = {
  role: Role;
  routes: RouteResult[];
};

type BrowserResult = {
  browser: BrowserName;
  roles: RoleResult[];
};

const root = process.cwd();
const outJson = path.join(root, 'data', 'portal_click_audit.json');
const outMd = path.join(root, 'data', 'portal_click_audit.md');

const BASE_URL = process.env.UI_AUDIT_BASE_URL || 'http://localhost:3100';

const creds: Record<Role, { phone: string; password: string; loginRoleText: 'Doctor' | 'Facility' | 'Admin' }> = {
  doctor: { phone: '03111111111', password: 'test123', loginRoleText: 'Doctor' },
  facility_admin: { phone: '03001234567', password: 'test123', loginRoleText: 'Facility' },
  platform_admin: { phone: '03000000000', password: 'test123', loginRoleText: 'Admin' },
};

const routesByRole: Record<Role, string[]> = {
  doctor: [
    '/doctor',
    '/doctor/bookings',
    '/doctor/attendance',
    '/doctor/wallet',
    '/doctor/disputes',
    '/doctor/messages',
    '/doctor/profile',
    '/doctor/settings',
    '/doctor/notifications',
  ],
  facility_admin: [
    '/facility',
    '/facility/post',
    '/facility/shifts',
    '/facility/bookings',
    '/facility/attendance',
    '/facility/payments',
    '/facility/disputes',
    '/facility/messages',
    '/facility/ratings',
    '/facility/settings',
  ],
  platform_admin: [
    '/admin',
    '/admin/verifications',
    '/admin/users',
    '/admin/facilities',
    '/admin/disputes',
    '/admin/policies',
    '/admin/payments',
    '/admin/audit',
    '/admin/analytics',
    '/admin/settings',
    '/admin/notifications',
  ],
};

async function login(page: Page, role: Role): Promise<void> {
  const c = creds[role];
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('textbox', { name: 'Phone Number' }).fill(c.phone);
  await page.getByRole('textbox', { name: '••••••••' }).fill(c.password);
  await page.getByRole('button', { name: c.loginRoleText, exact: true }).click();
  await page.getByRole('button', { name: `Sign in as ${c.loginRoleText}` }).click();
  await page.waitForTimeout(600);
}

async function auditRoute(page: Page, route: string, issues: AuditIssue[], browser: BrowserName, role: Role): Promise<RouteResult> {
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForTimeout(500);

  const headingFound = await page.locator('h1,h2,h3').first().isVisible().catch(() => false);

  const clickable = page.locator('main a[href], main button, main [role="button"], aside a[href], aside button, header button');
  const clickableCount = await clickable.count();
  let clickableChecked = 0;
  let clickableFailed = 0;

  const clickableLimit = Math.min(clickableCount, 120);
  for (let i = 0; i < clickableLimit; i += 1) {
    const el = clickable.nth(i);
    const visible = await el.isVisible().catch(() => false);
    if (!visible) continue;
    const disabled = await el.isDisabled().catch(() => false);
    if (disabled) continue;
    clickableChecked += 1;
    try {
      await el.scrollIntoViewIfNeeded();
      await el.click({ trial: true, timeout: 1200 });
    } catch (err: any) {
      clickableFailed += 1;
      const text = (await el.innerText().catch(() => '')).trim().slice(0, 100);
      issues.push({
        browser,
        role,
        route,
        type: 'interaction-failed',
        detail: `click trial failed: "${text || '<no-text>'}" (${err?.message || 'unknown'})`,
      });
    }
  }

  const inputs = page.locator('main input, main select, main textarea');
  const inputCount = await inputs.count();
  let inputChecked = 0;
  let inputFailed = 0;

  for (let i = 0; i < Math.min(inputCount, 80); i += 1) {
    const field = inputs.nth(i);
    const visible = await field.isVisible().catch(() => false);
    if (!visible) continue;
    inputChecked += 1;
    try {
      await field.scrollIntoViewIfNeeded();
      await field.focus({ timeout: 1200 });
    } catch (err: any) {
      inputFailed += 1;
      issues.push({
        browser,
        role,
        route,
        type: 'interaction-failed',
        detail: `input focus failed (${err?.message || 'unknown'})`,
      });
    }
  }

  return {
    route,
    headingFound,
    clickableChecked,
    clickableFailed,
    inputChecked,
    inputFailed,
  };
}

async function runForBrowser(name: BrowserName, browserType: BrowserType): Promise<{ result: BrowserResult; issues: AuditIssue[] }> {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const issues: AuditIssue[] = [];

  let activeRole: Role = 'doctor';
  let activeRoute = '/';
  let captureIssues = false;

  page.on('console', (msg) => {
    if (!captureIssues) return;
    if (msg.type() === 'error') {
      issues.push({
        browser: name,
        role: activeRole,
        route: activeRoute,
        type: 'console-error',
        detail: msg.text().slice(0, 300),
      });
    }
  });

  page.on('requestfailed', (req) => {
    if (!captureIssues) return;
    const errText = req.failure()?.errorText || 'request failed';
    if (errText.includes('ERR_ABORTED') || errText.includes('NS_BINDING_ABORTED')) return;
    issues.push({
      browser: name,
      role: activeRole,
      route: activeRoute,
      type: 'request-failed',
      detail: `${req.method()} ${req.url()} :: ${errText}`,
    });
  });

  const roles: RoleResult[] = [];

  for (const role of Object.keys(routesByRole) as Role[]) {
    activeRole = role;
    captureIssues = false;
    await login(page, role);
    const routeResults: RouteResult[] = [];
    for (const route of routesByRole[role]) {
      activeRoute = route;
      captureIssues = true;
      const rr = await auditRoute(page, route, issues, name, role);
      captureIssues = false;
      routeResults.push(rr);
    }
    roles.push({ role, routes: routeResults });
  }

  await browser.close();
  return { result: { browser: name, roles }, issues };
}

function summarize(results: BrowserResult[], issues: AuditIssue[]): string {
  const lines: string[] = [
    '# Portal Click Audit',
    '',
    `Base URL: ${BASE_URL}`,
    `Generated: ${new Date().toISOString()}`,
    '',
  ];

  for (const b of results) {
    lines.push(`## ${b.browser}`);
    for (const r of b.roles) {
      lines.push(`### ${r.role}`);
      for (const route of r.routes) {
        lines.push(
          `- ${route.route}: heading=${route.headingFound ? 'yes' : 'no'}, clickable=${route.clickableChecked}, clickableFailed=${route.clickableFailed}, inputs=${route.inputChecked}, inputFailed=${route.inputFailed}`
        );
      }
      lines.push('');
    }
  }

  lines.push('## Issues');
  if (issues.length === 0) {
    lines.push('- none');
  } else {
    for (const i of issues) {
      lines.push(`- [${i.browser}] [${i.role}] ${i.route} :: ${i.type} :: ${i.detail}`);
    }
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const chromiumRun = await runForBrowser('chromium', chromium);
  const firefoxRun = await runForBrowser('firefox', firefox);
  const results = [chromiumRun.result, firefoxRun.result];
  const issues = [...chromiumRun.issues, ...firefoxRun.issues];

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ baseUrl: BASE_URL, results, issues }, null, 2), 'utf8');
  fs.writeFileSync(outMd, summarize(results, issues), 'utf8');

  console.log(`Portal click audit saved: ${outJson}`);
  console.log(`Portal click audit summary: ${outMd}`);
  console.log(`Issue count: ${issues.length}`);

  // Fail when there are hard interaction issues.
  const interactionIssues = issues.filter((i) => i.type === 'interaction-failed');
  if (interactionIssues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('portal-click-audit failed:', err);
  process.exit(1);
});
