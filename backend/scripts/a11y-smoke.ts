import fs from 'fs';
import path from 'path';
import { chromium, firefox, type BrowserType, type Page } from 'playwright';

type Role = 'doctor' | 'facility_admin' | 'platform_admin';
type BrowserName = 'chromium' | 'firefox';

type A11yIssue = {
  browser: BrowserName;
  role: Role;
  route: string;
  category: 'unlabeled-field' | 'unnamed-button' | 'unnamed-link' | 'route-load-failed';
  detail: string;
};

const BASE_URL = process.env.UI_A11Y_BASE_URL || 'http://localhost:3100';
const root = process.cwd();
const outJson = path.join(root, 'data', 'a11y_smoke.json');
const outMd = path.join(root, 'data', 'a11y_smoke.md');

const creds: Record<Role, { phone: string; password: string; loginRoleText: 'Doctor' | 'Facility' | 'Admin' }> = {
  doctor: { phone: '03111111111', password: 'test123', loginRoleText: 'Doctor' },
  facility_admin: { phone: '03001234567', password: 'test123', loginRoleText: 'Facility' },
  platform_admin: { phone: '03000000000', password: 'test123', loginRoleText: 'Admin' },
};

const routesByRole: Record<Role, string[]> = {
  doctor: ['/doctor', '/doctor/bookings', '/doctor/attendance', '/doctor/wallet', '/doctor/disputes', '/doctor/messages', '/doctor/profile', '/doctor/settings', '/doctor/notifications'],
  facility_admin: ['/facility', '/facility/post', '/facility/shifts', '/facility/bookings', '/facility/attendance', '/facility/payments', '/facility/disputes', '/facility/messages', '/facility/ratings', '/facility/settings'],
  platform_admin: ['/admin', '/admin/verifications', '/admin/users', '/admin/facilities', '/admin/disputes', '/admin/policies', '/admin/payments', '/admin/audit', '/admin/analytics', '/admin/settings', '/admin/notifications'],
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

async function checkPage(page: Page): Promise<Array<{ category: A11yIssue['category']; detail: string }>> {
  return page.evaluate(() => {
    const issues: Array<{ category: A11yIssue['category']; detail: string }> = [];

    const fields = Array.from(document.querySelectorAll('main input, main textarea'));
    for (const field of fields) {
      const h = field as HTMLElement;
      const style = window.getComputedStyle(h);
      if (style.display === 'none' || style.visibility === 'hidden' || h.offsetParent === null) continue;
      if (h.className.includes('sr-only')) continue;
      const inputType = (field as HTMLInputElement).type || '';
      if (['hidden', 'checkbox', 'radio', 'range'].includes(inputType)) continue;
      const id = field.getAttribute('id');
      const hasLabel = !!id && !!document.querySelector(`label[for="${id}"]`);
      const hasWrappedLabel = !!field.closest('label');
      const hasAria = !!field.getAttribute('aria-label') || !!field.getAttribute('aria-labelledby');
      const hasTitle = !!field.getAttribute('title');
      const hasPlaceholder = !!field.getAttribute('placeholder');
      const prevText = (field.previousElementSibling?.textContent || '').trim();
      const hasPrevTextLabel = prevText.length > 0;
      if (!hasLabel && !hasWrappedLabel && !hasAria && !hasTitle && !hasPlaceholder && !hasPrevTextLabel) {
        issues.push({ category: 'unlabeled-field', detail: field.outerHTML.slice(0, 180) });
      }
    }

    const buttons = Array.from(document.querySelectorAll('main form button'));
    for (const btn of buttons) {
      const h = btn as HTMLElement;
      const style = window.getComputedStyle(h);
      if (style.display === 'none' || style.visibility === 'hidden' || h.offsetParent === null) continue;
      const txt = (btn.textContent || '').trim();
      const aria = btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.getAttribute('aria-labelledby');
      if (!txt && !aria) {
        issues.push({ category: 'unnamed-button', detail: btn.outerHTML.slice(0, 180) });
      }
    }

    const links = Array.from(document.querySelectorAll('main a, header a, aside a'));
    for (const link of links) {
      const h = link as HTMLElement;
      const style = window.getComputedStyle(h);
      if (style.display === 'none' || style.visibility === 'hidden' || h.offsetParent === null) continue;
      const txt = (link.textContent || '').trim();
      const aria = link.getAttribute('aria-label') || link.getAttribute('title') || link.getAttribute('aria-labelledby');
      if (!txt && !aria) {
        issues.push({ category: 'unnamed-link', detail: link.outerHTML.slice(0, 180) });
      }
    }

    return issues;
  });
}

async function runBrowser(name: BrowserName, browserType: BrowserType): Promise<A11yIssue[]> {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const issues: A11yIssue[] = [];

  for (const role of Object.keys(routesByRole) as Role[]) {
    await login(page, role);
    for (const route of routesByRole[role]) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      } catch (err: any) {
        issues.push({
          browser: name,
          role,
          route,
          category: 'route-load-failed',
          detail: err?.message || 'route load failed',
        });
        continue;
      }
      await page.waitForTimeout(400);
      const pageIssues = await checkPage(page);
      for (const i of pageIssues) {
        issues.push({ browser: name, role, route, category: i.category, detail: i.detail });
      }
    }
  }

  await browser.close();
  return issues;
}

function toMd(issues: A11yIssue[]): string {
  const lines = [
    '# Accessibility Smoke Audit',
    '',
    `Base URL: ${BASE_URL}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `Issue count: ${issues.length}`,
    '',
  ];

  if (issues.length === 0) {
    lines.push('- No labeling/name issues detected by smoke checks.');
  } else {
    for (const i of issues) {
      lines.push(`- [${i.browser}] [${i.role}] ${i.route} :: ${i.category} :: ${i.detail}`);
    }
  }
  return lines.join('\n');
}

async function main(): Promise<void> {
  const issues = [
    ...(await runBrowser('chromium', chromium)),
    ...(await runBrowser('firefox', firefox)),
  ];

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ baseUrl: BASE_URL, issues }, null, 2), 'utf8');
  fs.writeFileSync(outMd, toMd(issues), 'utf8');
  console.log(`A11y audit saved: ${outJson}`);
  console.log(`A11y summary: ${outMd}`);
  console.log(`Issue count: ${issues.length}`);

  if (issues.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('a11y-smoke failed:', err);
  process.exit(1);
});
