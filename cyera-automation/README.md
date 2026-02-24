# DSPM Platform — Playwright Test Automation Framework

Automated end-to-end and API testing framework for the DSPM (Data Security Posture Management) platform, built with Playwright and TypeScript.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Docker** and **Docker Compose** (to run the DSPM platform locally)

## Getting Started

### 1. Start the DSPM Platform

From the platform project root:

```bash
docker compose up -d
```

This starts:
- **Web app** on `http://localhost:3000`
- **API server** on `http://localhost:8080`

Wait for both services to be healthy before running tests.

### 2. Install Dependencies

```bash
cd cyera-automation
npm install
npx playwright install
```

### 3. Configure Environment

The `.env` file is pre-configured with defaults:

```env
BASE_URL=http://localhost:3000
API_URL=http://localhost:8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Aa123456
```

Adjust if your local setup uses different ports.

## Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run UI Tests Only

```bash
npx playwright test --project=ui
```

### Run API Tests Only

```bash
npx playwright test --project=api
```

### View HTML Report

```bash
npx playwright show-report
```

## Project Structure

```
cyera-automation/
├── playwright.config.ts          # Playwright configuration
├── global-setup.ts               # Auth setup (browser + API login)
├── global-teardown.ts            # Environment reset after all tests
├── .auth/                        # Generated at runtime (gitignored)
│   ├── session.json              # Browser storage state
│   └── token.json                # API bearer token
├── src/
│   ├── web/
│   │   ├── WebApp.ts             # Aggregates all page objects
│   │   └── pages/
│   │       ├── BasePage.ts       # Base page with common helpers
│   │       ├── LoginPage.ts      # Login page object
│   │       ├── AlertsPage.ts     # Alerts list page object
│   │       └── AlertDetailPage.ts# Alert detail drawer page object
│   ├── api/
│   │   ├── ApiClient.ts          # Aggregates all API resource clients
│   │   └── clients/
│   │       ├── BaseApiClient.ts  # Axios base with auth, logging
│   │       ├── AlertsClient.ts   # /api/alerts endpoints
│   │       ├── ScansClient.ts    # /api/scans endpoints
│   │       ├── PolicyClient.ts   # /api/policies & /api/policy-config
│   │       └── AdminClient.ts    # /api/admin/reset & /api/health
│   ├── types/
│   │   └── index.ts              # Shared TypeScript interfaces
│   └── utils/
│       ├── logger.ts             # Winston logger (console + file)
│       └── wait.ts               # Polling helpers for async operations
├── fixtures/
│   └── index.ts                  # Custom Playwright fixtures (app, api)
├── tests/
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

## Test Descriptions

### UI Tests

- **alert-manual-remediation.spec.ts** — Full manual remediation workflow through the UI: find an OPEN alert, transition to IN_PROGRESS, assign to an analyst, trigger remediation, wait for async completion, resolve, and verify.

### API Tests

- **alert-auto-remediation.spec.ts** — Auto-remediation lifecycle: start a scan, find an auto-remediate alert, wait for resolution, re-scan, and verify no duplicate OPEN alerts are created. **This test is expected to fail by design** — the platform intentionally re-creates alerts for the same policy/asset after a new scan, demonstrating a known limitation of the mock system.

### API Component Tests

- **alerts.spec.ts** — CRUD operations on alerts: list, filter, get by ID, status transitions, and comments.
- **scans.spec.ts** — Scan lifecycle: start scan, get by ID, check status.
- **policy.spec.ts** — Policy configuration endpoint: verify structure and expected fields.

## Architecture Notes

- **Authentication** is handled once in `global-setup.ts` — browser login saves `storageState`, API login saves a bearer token. All tests start pre-authenticated.
- **Cleanup** runs in `global-teardown.ts` via `POST /api/admin/reset`, restoring the database to defaults after all tests.
- **Workers** are set to 1 to avoid database conflicts.
- **Polling utilities** (`waitForAlertStatus`, `waitForScanComplete`) are used for all async status checks — no arbitrary timeouts.
- **All API calls** are logged via Winston (console + `logs/run.log`).
