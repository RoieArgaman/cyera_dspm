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
│   ├── api.ts                    # API helper functions (axios-based)
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── logger.ts                 # Winston logger (console + file)
│   ├── wait.ts                   # Polling helpers (waitForAlertStatus, waitForScanComplete)
│   └── pages/
│       ├── AlertsPage.ts         # Alerts list page object
│       └── AlertDetailPage.ts    # Alert detail drawer page object
├── fixtures/
│   └── index.ts                  # Extends base test with `api` fixture (axios instance)
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
2. **UI tests** depend on setup — `page` is pre-authenticated via `storageState`. Page objects are instantiated directly in each test.
3. **API tests** depend on setup — the `api` fixture provides a configured axios instance with the bearer token.
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
- **No abstract base classes** — page objects and API helpers are simple, standalone.
- **Polling utilities** (`waitForAlertStatus`, `waitForScanComplete`) are used for async status checks.
- **All API calls** are logged via Winston (console + `logs/run.log`).
