# DSPM Platform — Playwright Test Automation

Automated **UI** and **API** test framework for the DSPM (Data Security Posture Management) platform, built with **Playwright** and **TypeScript**.

The DSPM platform scans cloud assets (AWS, GCP, GitHub, Snowflake, etc.), evaluates them against security policies, and produces violation alerts with remediation workflows.

**Core flow:**  Policies → Scan → Alerts → Remediation → Resolved Alert → Rescan Verification

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
  - [All Tests](#all-tests)
  - [UI Tests Only](#ui-tests-only)
  - [API Tests Only](#api-tests-only)
  - [One-Command E2E](#one-command-e2e)
- [Viewing Reports](#viewing-reports)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
  - [Test Projects and Execution Flow](#test-projects-and-execution-flow)
  - [Fixtures](#fixtures)
  - [Page Objects (UI Layer)](#page-objects-ui-layer)
  - [API Clients](#api-clients)
  - [Logging](#logging)
- [Test Coverage](#test-coverage)
  - [UI Tests](#ui-tests)
  - [API Integration Tests](#api-integration-tests)
  - [API Component Tests](#api-component-tests)
- [Alert Status Lifecycle](#alert-status-lifecycle)
- [Environment Variables](#environment-variables)
- [Stopping the Platform](#stopping-the-platform)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | 18+ (LTS recommended) |
| **Docker** | Docker Desktop or Docker Engine — must be **running** before starting the platform |

### Dependencies

Installed automatically via `npm install`:

| Package | Purpose |
|---|---|
| `@playwright/test` | Test runner and browser automation framework |
| `typescript` | TypeScript compiler |
| `axios` | HTTP client for REST API tests |
| `dotenv` | Load environment variables from `.env` |
| `winston` | Structured logging (stdout/stderr + file) |
| `allure-playwright` | Allure report integration for Playwright |
| `allure-commandline` | CLI to generate and serve Allure reports |
| `allure-js-commons` | Shared Allure utilities |

---

## Quick Start

All commands are run from the `cyera-automation/` directory.

### 1. Install dependencies

```bash
cd cyera-automation
npm install
npx playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set the admin password:

```
ADMIN_PASSWORD=your_password_here
```

> The `.env` file is git-ignored and must **not** be committed.

### 3. Start the platform

```bash
npm run start
```

This script will:
1. Verify Docker is installed and running.
2. Unzip the platform from `platform Assignment.zip` into `platform-home-assignment/`.
3. Fix Docker credential config if needed.
4. Run `docker compose up -d`.
5. Wait for the API health check to pass.

Once started:

| Service | URL |
|---|---|
| Web App | http://localhost:3000 |
| REST API | http://localhost:8080 |
| Health Check | http://localhost:8080/api/health |
| Policy Config | http://localhost:8080/api/policy-config |

**Login credentials:** `admin` / the password you set in `.env`

### 4. Run tests

```bash
npm test
```

---

## Running Tests

With the platform running:

### All Tests

```bash
npm test
```

### UI Tests Only

```bash
npm run test:ui
```

### API Tests Only

```bash
npm run test:api
```

### One-Command E2E

Starts the platform and runs all tests in a single command:

```bash
npm run e2e
```

---

## Viewing Reports

### Playwright HTML Report

```bash
npm run report
```

On local runs the HTML report opens automatically after each test run (`open: 'always'` in `playwright.config.ts`).

### Allure Report

```bash
npm run allure:serve    # start a temporary server with the report
npm run allure:open     # open the generated report
```

---

## Project Structure

```
cyera-automation/
├── .env.example                        # Environment template
├── AGENTS.md                           # Page Object & test guidelines
├── package.json                        # Scripts, dependencies
├── playwright.config.ts                # Playwright configuration
├── tsconfig.json                       # TypeScript configuration
│
├── scripts/
│   └── start-platform.sh              # Unzip, Docker compose up, health check
│
├── fixtures/
│   └── index.ts                        # Playwright fixtures (app, api)
│
├── src/
│   ├── api/
│   │   ├── ApiClient.ts                # Facade: alerts, scans, policy, admin
│   │   ├── clients/
│   │   │   ├── BaseApiClient.ts        # Shared Axios instance, logging, HTTP helpers
│   │   │   ├── AlertsClient.ts         # GET/PATCH alerts, add comments
│   │   │   ├── ScansClient.ts          # Start scans, get status
│   │   │   ├── PolicyClient.ts         # Get policy configuration
│   │   │   └── AdminClient.ts          # Reset data
│   │   └── types/
│   │       ├── alert.ts                # Alert, AlertStatus, Comment types
│   │       ├── scan.ts                 # Scan types
│   │       ├── policy.ts               # Policy config types
│   │       ├── auth.ts                 # Auth types
│   │       ├── admin.ts                # Admin types
│   │       └── index.ts                # Re-exports
│   │
│   ├── web/
│   │   ├── WebApp.ts                   # UI facade — wires page objects for fixtures
│   │   └── pages/
│   │       ├── BasePage.ts             # Navigation, visibility helpers
│   │       ├── LoginPage.ts            # Login form interactions
│   │       ├── AlertsPage.ts           # Alerts list table interactions
│   │       └── AlertDetailPage.ts      # Alert drawer: status, remediation, comments
│   │
│   ├── decorators/
│   │   └── stepDecorator.ts            # @step decorator for logging + Playwright steps
│   │
│   ├── logger/
│   │   └── logger.ts                   # Winston logger (stdout/stderr + file)
│   │
│   └── wait.ts                         # Polling helpers (waitForScanComplete, waitForAlertStatus)
│
└── tests/
    ├── auth.setup.ts                   # Setup project: browser login + API token
    ├── teardown.setup.ts               # Teardown project: reset environment data
    │
    ├── ui/
    │   ├── index.ts                    # UI fixtures (scan fixture for alert seeding)
    │   └── alert-manual-remediation.spec.ts  # Manual remediation lifecycle (UI)
    │
    └── api/
        ├── index.ts                    # API fixtures (alertsAfterScan)
        ├── alert-auto-remediation.spec.ts    # Auto-remediation + rescan (expected to fail)
        └── component/
            ├── alerts.spec.ts          # Alert CRUD and status transitions
            ├── scans.spec.ts           # Scan start, get by ID, status
            └── policy.spec.ts          # Policy config schema validation
```

---

## Architecture Overview

### Test Projects and Execution Flow

Playwright is configured with four projects that run in a defined order:

```
setup  →  ui + api  →  teardown
```

| Project | Matches | Purpose |
|---|---|---|
| `setup` | `tests/auth.setup.ts` | Logs in via browser, saves session state and API token |
| `ui` | `tests/ui/**/*.spec.ts` | UI tests (depends on `setup`) |
| `api` | `tests/api/**/*.spec.ts` | API tests (depends on `setup`) |
| `teardown` | `tests/teardown.setup.ts` | Resets the environment via `POST /api/admin/reset` |

Tests run **serially** (single worker, `fullyParallel: false`) to avoid state conflicts.

### Fixtures

Defined in `fixtures/index.ts` and extended per test directory:

| Fixture | Scope | Description |
|---|---|---|
| `app` (`WebApp`) | UI tests | Page object facade — exposes `app.login`, `app.alerts`, `app.alertDetail` |
| `api` (`ApiClient`) | All tests | API client facade — exposes `api.alerts`, `api.scans`, `api.policy`, `api.admin` |
| `scan` | UI tests | Runs a scan and ensures an OPEN alert with `autoRemediate: false` exists |
| `alertsAfterScan` | API component tests | Runs a scan and returns the resulting alerts array |

A `beforeEach` hook resets data (`POST /api/admin/reset`) before each test when running with a single worker and shard.

### Page Objects (UI Layer)

Located in `src/web/pages/`. Each page extends `BasePage` which provides:

- `navigate(path)` — navigates with `networkidle` wait
- `waitForVisible(locator)` / `waitForHidden(locator)` — visibility helpers
- `getCurrentUrl()` — for assertions and debugging

Pages:

| Class | Responsibility |
|---|---|
| `LoginPage` | Login form interaction |
| `AlertsPage` | Alerts table: list, filter, click rows |
| `AlertDetailPage` | Alert detail drawer: change status, assign, remediate, add comments |

All Page Object methods are decorated with `@step('...')` for Playwright report visibility and structured logging.

### API Clients

Located in `src/api/clients/`. Each client extends `BaseApiClient` which provides:

- A shared Axios instance with auth headers
- Request/response logging interceptors
- Type-safe HTTP helpers (`get`, `post`, `patch`, `put`, `delete`)

Clients:

| Client | Endpoints |
|---|---|
| `AlertsClient` | `GET /api/alerts`, `GET /api/alerts/:id`, `PATCH /api/alerts/:id`, `POST /api/alerts/:id/comments` |
| `ScansClient` | `POST /api/scans`, `GET /api/scans/:id`, `GET /api/scans/status` |
| `PolicyClient` | `GET /api/policy-config` |
| `AdminClient` | `POST /api/admin/reset` |

### Logging

- **Winston logger** (`src/logger/logger.ts`) — human-readable to stdout/stderr, JSON to `logs/run.log`
- **`@step` decorator** (`src/decorators/stepDecorator.ts`) — logs method entry/exit, wraps in `test.step()` for Playwright reports
- API clients automatically log all requests and responses via Axios interceptors

---

## Test Coverage

### UI Tests

**Alert Manual Remediation** (`tests/ui/alert-manual-remediation.spec.ts`)

Validates the full manual remediation lifecycle through the browser:

1. Navigate to the alerts list
2. Find an OPEN alert with Auto Remediate OFF
3. Change status to In Progress
4. Assign to Security Analyst
5. Add remediation notes and click Remediate
6. Wait for status to become Awaiting User Verification
7. Change status to Resolved
8. Add comment: "Remediation verified successfully and issue is resolved"
9. Assert final status is Resolved

### API Integration Tests

**Alert Auto-Remediation + Rescan** (`tests/api/alert-auto-remediation.spec.ts`)

> **Note:** This test is **expected to fail** by design at the final assertion.

1. Start a scan
2. Find an alert with Auto Remediate ON
3. Wait for auto-remediation to complete
4. Set status to Resolved
5. Add resolution comment
6. Start a second scan
7. Verify no identical alert was re-created (this assertion intentionally fails — the platform re-detects the violation)

### API Component Tests

| Test File | Coverage |
|---|---|
| `alerts.spec.ts` | GET all alerts, filter by status, GET by ID, status transitions (valid + invalid), add comment |
| `scans.spec.ts` | Start scan, GET by ID, GET status |
| `policy.spec.ts` | GET policy config, validate schema (assets, enums, labels) |

---

## Alert Status Lifecycle

```
OPEN ──────────────────→ IN PROGRESS ──────────→ RESOLVED
                              │                       │
                              │ (system)              │
                              ▼                       ▼
                    REMEDIATION IN PROGRESS       REOPEN
                              │                       │
                              │ (system)              │
                              ▼                       ▼
                    AWAITING CUSTOMER ──────→ RESOLVED / REOPEN
```

| From Status | To Status | Triggered By |
|---|---|---|
| OPEN | IN PROGRESS | User |
| IN PROGRESS | REMEDIATION IN PROGRESS | System (triggered by user action) |
| IN PROGRESS | RESOLVED | User |
| REMEDIATION IN PROGRESS | AWAITING CUSTOMER | System |
| AWAITING CUSTOMER | RESOLVED | User |
| AWAITING CUSTOMER | REOPEN | User |
| RESOLVED | REOPEN | User |
| REOPEN | IN PROGRESS | User |

---

## Environment Variables

Configured via `.env` (copy from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Web app URL |
| `API_URL` | `http://localhost:8080` | REST API URL |
| `ADMIN_USERNAME` | `admin` | Login username |
| `ADMIN_PASSWORD` | *(required)* | Login password |

If the default ports are in use, override them via a `.env` file in the platform directory:

```
WEB_PORT=3000
API_PORT=8080
```

---

## Stopping the Platform

From the `platform-home-assignment/` directory (created by the start script):

```bash
docker compose down
```

To view platform logs:

```bash
docker compose logs -f
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| **Docker not running** | Start Docker Desktop or the Docker daemon before running `npm run start` |
| **Ports 3000/8080 in use** | Override ports via `.env` in the platform directory (`WEB_PORT`, `API_PORT`) |
| **`docker-credential-desktop` error** | The start script auto-fixes this by clearing `credsStore` in `~/.docker/config.json` |
| **Tests fail with "Token file not found"** | The `setup` project did not run. Run all tests with `npm test` or ensure `auth.setup.ts` runs first |
| **API health check timeout** | Services may still be starting. Wait a minute and try `curl http://localhost:8080/api/health` |
| **Auto-remediation test fails** | This is **expected by design** — the platform re-detects resolved violations on rescan |
