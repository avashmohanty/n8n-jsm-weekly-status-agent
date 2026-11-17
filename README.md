# n8n: JSM Weekly Status Agent

An n8n workflow that pulls the last week of Jira Service Management tickets, reduces them to anonymous aggregate counts, asks an LLM to draft a short steering-group status note, and emails the draft for human review.

## Problem
Weekly delivery status reports are assembled by hand from ticket exports. They take time, vary in quality week to week, and the obvious automation (paste tickets into an LLM) leaks ticket text and names into a third-party model, which is unacceptable in regulated environments.

## Approach
1. **Schedule Trigger**: Mondays 08:00.
2. **HTTP Request**: Jira Cloud search (`/rest/api/3/search/jql`) for tickets created or resolved in the last 7 days plus all unresolved.
3. **Code node (`aggregate.js`)**: computes created, resolved, net flow, open by priority, oldest open age, median resolution hours. **Only these counts continue downstream.** No ticket text, summaries, or names reach the LLM.
4. **HTTP Request to the Anthropic Messages API**: drafts a 120-word note under a constrained prompt (use only supplied numbers, no invented causes). The model name is set in the node; change it to whichever current model you use.
5. **Email node**: sends the draft to you, labelled as a draft. A human reviews before it goes anywhere else.

Design choices: aggregate before the model (data minimisation), constrained prompt (limits hallucinated root causes), human-in-the-loop (no auto-send to stakeholders).

## Setup
- Import `jsm_weekly_status_agent.json` into n8n.
- Set `JIRA_BASE_URL` (e.g. `https://yourcompany.atlassian.net`) as an n8n environment variable, and replace `YOUR_PROJECT_KEY` in the JQL.
- Create credentials: Jira (HTTP Basic: email + API token), Anthropic (Header Auth: `x-api-key`), SMTP.
- Replace the placeholder from/to email addresses.

## Measured result
- `node test_aggregate.js` runs the aggregation logic against mock tickets: created, resolved, open count, oldest-open age, median resolution time, and net flow all match expected values (**PASS**).
- LLM payload contains **0 ticket-level fields**: counts only.

**Your real-world result (fill in after running for 4 weeks):**
| Metric | Before (manual) | After |
|---|---|---|
| Minutes per weekly report | _ | _ |
| Edits needed before sending | n/a | _ |

## Status and limitations
- **Not yet run end-to-end against a live Jira or n8n instance by the author of this first commit.** The aggregation code is unit-tested; the node parameters and Jira endpoint should be verified against your n8n version and Jira edition before production use.
- The search request fetches up to 100 issues and does **not** paginate. For projects with more than 100 relevant tickets the counts will be understated. Add `nextPageToken` pagination before using this on a busy project.
- Priority names are taken as-is from Jira. Rename them in your project or map them in `aggregate.js`.

Created by Avash Mohanty, 2026
