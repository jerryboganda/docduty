import fs from 'fs';
import path from 'path';
import autocannon from 'autocannon';

const root = process.cwd();
const outJson = path.join(root, 'data', 'load_test.json');
const outMd = path.join(root, 'data', 'load_test.md');
const base = process.env.LOAD_TEST_BASE_URL || 'http://localhost:3001';

type Result = {
  name: string;
  url: string;
  durationSec: number;
  connections: number;
  requestsAverage: number;
  requestsP99: number;
  latencyAverage: number;
  latencyP99: number;
  errors: number;
  timeouts: number;
  non2xx: number;
};

function runCase(opts: autocannon.Options): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getToken(): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: '03001234567', password: 'test123' }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const body = await res.json();
  return body.accessToken;
}

function pick(name: string, url: string, durationSec: number, connections: number, r: autocannon.Result): Result {
  return {
    name,
    url,
    durationSec,
    connections,
    requestsAverage: r.requests.average,
    requestsP99: r.requests.p99,
    latencyAverage: r.latency.average,
    latencyP99: r.latency.p99,
    errors: r.errors,
    timeouts: r.timeouts,
    non2xx: r.non2xx,
  };
}

function toMd(results: Result[]): string {
  const lines = [
    '# Load Test Results',
    '',
    `Base URL: ${base}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Scenario | Avg req/s | p99 req/s | Avg latency (ms) | p99 latency (ms) | errors | timeouts | non2xx |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const r of results) {
    lines.push(`| ${r.name} | ${r.requestsAverage.toFixed(2)} | ${r.requestsP99.toFixed(2)} | ${r.latencyAverage.toFixed(2)} | ${r.latencyP99.toFixed(2)} | ${r.errors} | ${r.timeouts} | ${r.non2xx} |`);
  }
  return lines.join('\n');
}

async function main(): Promise<void> {
  const durationSec = parseInt(process.env.LOAD_TEST_DURATION_SEC || '10', 10);
  const connections = parseInt(process.env.LOAD_TEST_CONNECTIONS || '20', 10);

  const token = await getToken();

  const scenarios = [
    {
      name: 'health',
      options: {
        url: `${base}/api/health`,
        method: 'GET',
        connections,
        duration: durationSec,
      } satisfies autocannon.Options,
    },
    {
      name: 'login',
      options: {
        url: `${base}/api/auth/login`,
        method: 'POST',
        connections,
        duration: durationSec,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '03111111111', password: 'test123' }),
      } satisfies autocannon.Options,
    },
    {
      name: 'facility_bookings',
      options: {
        url: `${base}/api/bookings?limit=20`,
        method: 'GET',
        connections,
        duration: durationSec,
        headers: { Authorization: `Bearer ${token}` },
      } satisfies autocannon.Options,
    },
  ];

  const results: Result[] = [];
  for (const s of scenarios) {
    const r = await runCase(s.options);
    results.push(pick(s.name, s.options.url!, durationSec, connections, r));
  }

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ base, durationSec, connections, results }, null, 2), 'utf8');
  fs.writeFileSync(outMd, toMd(results), 'utf8');
  console.log(`Load test written: ${outJson}`);
  console.log(`Load test summary: ${outMd}`);

  // Login endpoint is intentionally rate-limited, so non-2xx (429) is expected under load.
  const broken = results.some((r) => {
    const non2xxBlocking = r.name === 'login' ? 0 : r.non2xx;
    return r.errors > 0 || r.timeouts > 0 || non2xxBlocking > 0;
  });
  if (broken) process.exitCode = 1;
}

main().catch((err) => {
  console.error('load-test failed:', err);
  process.exit(1);
});
