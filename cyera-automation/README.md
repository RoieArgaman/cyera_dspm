# DSPM Platform — Playwright Test Automation Framework

Automated end-to-end and API testing framework for the DSPM platform, built with Playwright and TypeScript.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Docker** and **Docker Compose**

## Getting Started

### 1. Start the DSPM Platform

```bash
docker compose up -d
```

Web app: `http://localhost:3000` | API: `http://localhost:8080`

### 2. Install Dependencies

```bash
cd cyera-automation
npm install
npx playwright install chromium
```

### 3. Configure Environment

Copy `.env.example` to `.env` and set your password:

```bash
cp .env.example .env
```

## Running Tests

```bash
npx playwright test              # all tests
npx playwright test --project=ui # UI tests only
npx playwright test --project=api # API tests only
npx playwright show-report       # view HTML report
```

## Project Structure

```
cyera-automation/
├── playwright.config.ts          # Config: setup/teardown projects, Chrome only
├── .auth/                        # Generated at runtime (gitignored)
│   ├── session.json              # Browser storage state
│   └── token.json                # API bearer token
├── src/
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── logger.ts                 # Winston logger (console + file)
│   ├── wait.ts                   # Polling helpers (waitForAlertStatus, waitForScanComplete)
│   ├── api/
│   │   ├── ApiClient.ts          # Aggregates all API resource clients
│   │   └── clients/
│   │       ├── BaseApiClient.ts  # Axios base with auth header + logging
│   │       ├── AlertsClient.ts   # /api/alerts endpoints
│   │       ├── ScansClient.ts    # /api/scans endpoints
│   │       ├── PolicyClient.ts   # /api/policy-config endpoint
│   │       └── AdminClient.ts    # /api/admin/reset & /api/health
│   └── web/
│       ├── WebApp.ts             # Aggregates all page objects
│       └── pages/
│           ├── BasePage.ts       # Base page with common helpers
│           ├── LoginPage.ts      # Login page object
│           ├── AlertsPage.ts     # Alerts list page object
│           └── AlertDetailPage.ts# Alert detail drawer page object
├── fixtures/
│   └── index.ts                  # Custom fixtures: app (WebApp), api (ApiClient)
├── tests/
│   ├── auth.setup.ts             # Setup: browser login + API token (runs first)
│   ├── teardown.setup.ts         # Teardown: reset DB (runs last)
│   ├── ui/
│   │   └── alert-manual-remediation.spec.ts
│   └── api/
│       ├── alert-auto-remediation.spec.ts
│       └── component/
│           ├── alerts.spec.ts
│           ├── scans.spec.ts
│           └── policy.spec.ts
└── logs/                         # Generated at runtime (gitignored)
```

## How It Works

1. **Setup project** (`auth.setup.ts`) runs first as a Playwright test — logs in via the browser using `page` (Chromium only), saves `storageState` to `.auth/session.json`, and fetches an API token to `.auth/token.json`.
2. **UI tests** depend on setup — `page` is pre-authenticated via `storageState`. The `app` fixture provides a `WebApp` instance that aggregates all page objects (`app.alerts`, `app.alertDetail`, `app.login`).
3. **API tests** depend on setup — the `api` fixture provides an `ApiClient` instance that aggregates all resource clients (`api.alerts`, `api.scans`, `api.policy`, `api.admin`).
4. **Teardown project** (`teardown.setup.ts`) runs last — calls `POST /api/admin/reset` to restore the DB.

## Tests

| Test | Description |
|------|-------------|
| **alert-manual-remediation** (UI) | Full remediation workflow: OPEN → IN_PROGRESS → Remediate → RESOLVED |
| **alert-auto-remediation** (API) | Auto-remediation lifecycle with re-scan. **Expected to fail by design** — the platform re-creates alerts after a new scan. |
| **alerts** (API component) | CRUD: list, filter, get by ID, status transitions, comments |
| **scans** (API component) | Start scan, get by ID, check status |
| **policy** (API component) | GET /api/policy-config structure validation |

## Notes

- **Chrome only** — all browser tests run on Chromium.
- **Workers: 1** — avoids shared database conflicts.
- **Class hierarchy** — API clients extend `BaseApiClient` (axios + auth + logging), page objects extend `BasePage` (navigation + visibility helpers). `ApiClient` and `WebApp` aggregate their respective sub-classes.
- **Polling utilities** (`waitForAlertStatus`, `waitForScanComplete`) are used for async status checks.
- **All API calls** are logged via Winston (console + `logs/run.log`).
