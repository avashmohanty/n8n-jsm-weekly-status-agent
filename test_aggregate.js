// Offline test of the aggregation logic with mock Jira data (run: node test_aggregate.js)
const fs = require('fs');
const src = fs.readFileSync('aggregate.js', 'utf8');
const h = h => new Date(Date.now() - h * 3600000).toISOString();
const mock = [{ json: { issues: [
  { fields: { issuetype: { name: 'Incident' }, priority: { name: 'P1' }, created: h(10), resolutiondate: h(6) } },          // created+resolved, 4h
  { fields: { issuetype: { name: 'Service Request' }, priority: { name: 'P3' }, created: h(48), resolutiondate: h(24) } },  // created+resolved, 24h
  { fields: { issuetype: { name: 'Service Request' }, priority: { name: 'P3' }, created: h(24 * 20), resolutiondate: null } }, // open, 20d old
  { fields: { issuetype: { name: 'Incident' }, priority: { name: 'P2' }, created: h(5), resolutiondate: null } }              // created+open
]}}];
const fn = new Function('$input', src.replace(/^\/\/.*$/gm, ''));
const out = fn({ all: () => mock })[0].json.stats;
console.log(JSON.stringify(out));
const ok = out.created === 3 && out.resolved === 2 && out.open_total === 2 && out.oldest_open_days === 20 && out.median_resolution_hours === 14 && out.net_flow === 1;
console.log(ok ? 'PASS' : 'FAIL'); process.exit(ok ? 0 : 1);
