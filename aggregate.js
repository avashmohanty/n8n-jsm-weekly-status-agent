// n8n Code node ("Run Once for All Items"). Reduces raw Jira issues to anonymous aggregate counts.
// Only these aggregates leave the workflow toward the LLM: no ticket text, no names.
const issues = $input.all().flatMap(i => i.json.issues || []);
const now = Date.now();
const DAY = 86400000;
const stats = { window_days: 7, created: 0, resolved: 0, open_total: 0, by_type: {}, by_priority_open: {}, oldest_open_days: 0, median_resolution_hours: null };
const resHours = [];
for (const it of issues) {
  const f = it.fields || {};
  const type = (f.issuetype && f.issuetype.name) || 'Unknown';
  const prio = (f.priority && f.priority.name) || 'None';
  const created = new Date(f.created).getTime();
  const resolved = f.resolutiondate ? new Date(f.resolutiondate).getTime() : null;
  stats.by_type[type] = stats.by_type[type] || { created: 0, resolved: 0 };
  if (now - created <= 7 * DAY) { stats.created++; stats.by_type[type].created++; }
  if (resolved && now - resolved <= 7 * DAY) { stats.resolved++; stats.by_type[type].resolved++; resHours.push((resolved - created) / 3600000); }
  if (!resolved) {
    stats.open_total++;
    stats.by_priority_open[prio] = (stats.by_priority_open[prio] || 0) + 1;
    stats.oldest_open_days = Math.max(stats.oldest_open_days, Math.floor((now - created) / DAY));
  }
}
if (resHours.length) {
  resHours.sort((a, b) => a - b);
  const m = Math.floor(resHours.length / 2);
  stats.median_resolution_hours = Math.round((resHours.length % 2 ? resHours[m] : (resHours[m - 1] + resHours[m]) / 2) * 10) / 10;
}
stats.net_flow = stats.created - stats.resolved;
return [{ json: { stats } }];
// Created by Avash Mohanty, 2026
