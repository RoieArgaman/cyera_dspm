# DSPM Platform — Playwright Test Automation Framework

Automated end-to-end and API testing for the DSPM platform (Playwright + TypeScript).

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Docker** — Download and install Docker (Docker Desktop or Docker engine) and have it **running** before starting the platform.

## What to Do

### One-time setup

From `cyera-automation/`:

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Edit `.env` and set `ADMIN_PASSWORD` to your desired admin password (for example, change `ADMIN_PASSWORD=your_password_here` to a real value). This value should live **only** in your local `.env` file, which is git-ignored and must not be committed.

### Start the platform

From `cyera-automation/`:

```bash
npm run start
```

Then open **http://localhost:3000** and log in with **admin** and the password you configured in your local `.env` (`ADMIN_PASSWORD`).

**What happens:** The script checks Docker is running, unzips the platform from `platform Assignment.zip` into `platform-home-assignment/`, fixes Docker credential config if needed, runs `docker compose up -d`, and waits for the API to be healthy. Web app: `http://localhost:3000` | API: `http://localhost:8080`.

### Run tests

With the platform running:

```bash
npm test              # all tests
npm run test:ui       # UI only
npm run test:api      # API only
npm run e2e           # start platform then run all tests
npm run report        # open HTML report
```

## Project structure (short)

- `scripts/start-platform.sh` — Unzip, fix Docker, start compose, health check.
- `src/api/` — API clients. `src/web/` — Page objects.
- `tests/ui/` — UI specs. `tests/api/` — API and component specs.
- `fixtures/` — Playwright fixtures (app, api). Auth and teardown run via setup projects.

For **Playwright Page Object and test guidelines**, see `AGENTS.md` in this directory.

## Logging and test steps

We use a centralized Winston logger (`src/logger/logger.ts`) plus a Playwright step decorator (`src/test/stepDecorator.ts`).

- **Logger**
  - Use `logger.info` / `logger.debug` for normal operations.
  - Use `logger.warn` / `logger.error` for exceptional events and failures.
  - The logger writes human‑readable logs to stdout (info/debug) and stderr (warn/error), which are visible via `docker compose logs -f`.
  - API clients log all requests, responses, and errors via `BaseApiClient` interceptors.

- **Playwright `@step` decorator**
  - For high‑level page‑object methods (navigation, remediation, comments, etc.), use `@step('Description')` from `src/test/stepDecorator`.
  - The decorator:
    - Logs `info` with the step message and arguments.
    - Wraps the method in `test.step(...)` so it appears in Playwright reports and traces.
    - Logs `error` if the method throws, then rethrows so the test still fails.

- **Rules**
  - Do **not** use `console.log` / `console.warn` in `cyera-automation`; always use `logger`.
  - In UI tests, interact through page objects and rely on `@step` for meaningful, readable steps.
  - Do **not** log secrets or sensitive payloads; prefer IDs, counts, and statuses.
