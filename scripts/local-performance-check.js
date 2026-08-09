import { app } from '../backend/server.js';

const server = await new Promise((resolve) => { const instance = app.listen(0, () => resolve(instance)); });
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;
const total = Number(process.env.PERF_REQUESTS || 60);
const started = performance.now();
const results = await Promise.all(Array.from({ length: total }, async (_, index) => {
  const route = index % 3 === 0 ? '/api/graph' : '/api/health';
  const requestStarted = performance.now();
  try {
    const response = await fetch(`${baseUrl}${route}`);
    return { route, status: response.status, durationMs: performance.now() - requestStarted };
  } catch (error) {
    return { route, status: 0, durationMs: performance.now() - requestStarted, error: error.message };
  }
}));
await new Promise((resolve) => server.close(resolve));

const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
const percentile = (p) => durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] || 0;
const errors = results.filter((item) => item.status < 200 || item.status >= 300);
const report = { checkedAt: new Date().toISOString(), totalRequests: total, elapsedMs: Math.round(performance.now() - started), errors: errors.length, errorRate: errors.length / total, latencyMs: { p50: Math.round(percentile(0.5) * 100) / 100, p95: Math.round(percentile(0.95) * 100) / 100, max: Math.round(Math.max(...durations) * 100) / 100 }, thresholds: { maxErrorRate: 0, maxP95Ms: 1000 }, gate: errors.length === 0 && percentile(0.95) <= 1000 ? 'PASS' : 'REVIEW', routes: [...new Set(results.map((item) => item.route))] };
console.log(JSON.stringify(report, null, 2));
if (report.gate !== 'PASS') process.exitCode = 1;
