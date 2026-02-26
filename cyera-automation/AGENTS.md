# Playwright Page Objects and tests

This guide describes how we structure Playwright Page Objects and tests in `cyera-automation/`. It is meant to be **practical and opinionated** so that new code looks and behaves the same as existing code.

## Running tests, reports, and teardown

- **Projects and teardown flow**
  - Playwright defines four projects:
    - `setup` – `tests/auth.setup.ts` (logs in, writes `.auth/session.json` and `.auth/token.json`).
    - `ui` – `tests/ui/**/*.spec.ts`, depends on `setup`.
    - `api` – `tests/api/**/*.spec.ts`, depends on `setup`.
    - `teardown` – `tests/teardown.setup.ts`, runs as the teardown of the `setup` project.
  - When you run `npx playwright test` (or `npm test` from `cyera-automation`):
    - `setup` runs first.
    - `ui` / `api` run next.
    - `teardown` runs once at the end, even if some tests failed.
  - **Headless behavior**: The `setup` project is configured to always run headless (`headless: true` in its project `use` block), regardless of the global `headless` default in `playwright.config.ts`. So only the login/setup step runs without a visible browser; `ui` and `api` tests follow the global setting (e.g. headed by default for local debugging).
- **Environment reset**
  - Environment cleanup lives in `tests/teardown.setup.ts` as a test named `reset environment after all tests`.
  - It uses `ApiClient.admin.resetData()` to reset the backend and logs structured events with `operation: 'teardown.resetEnvironment'`.
  - From `logs/run.log` (or the trace Logs panel) you can quickly see:
    - Whether teardown ran at all (look for `operation: 'teardown.resetEnvironment'`).
    - If it skipped due to a missing token file.
    - Whether the reset call reported `success` and what `message` it returned.
- **HTML report**
  - Playwright’s HTML reporter is configured to open automatically on local runs (`open: 'always'` in `playwright.config.ts`).
  - After a run, use `npx playwright show-report` (or rely on the auto-open behavior) to inspect tests, API steps, and teardown behavior.

## Page Object philosophy

- **Why Page Objects**
  - **Encapsulation**: Hide raw Playwright calls (`page.locator`, `page.goto`, waits) behind readable methods.
  - **Reusability**: Share navigation and interactions across many tests.
  - **Stability**: Keep selectors and timing logic in one place so tests stay focused on behavior.

- **Naming and location**
  - **Classes**: Use the suffix `Page`, for example `LoginPage`, `AlertsPage`, `AlertDetailPage`.
  - **Folder**: Put page classes under `src/web/pages/`.
  - **Base class**: Common helpers live in `src/web/pages/BasePage.ts` and are shared via inheritance.
  - **App façade**: `src/web/WebApp.ts` exposes a typed entry point (`WebApp`) that wires pages together for fixtures.

## Selectors and `data-testid` guidelines

- **Preferred: `data-testid` with `getByTestId`**
  - Use stable, explicit attributes for elements that tests depend on.
  - Example attributes in the app (to be added/standardized as we evolve the UI):
    - `data-testid="alerts-page"`
    - `data-testid="alerts-table"`
    - `data-testid="alert-row"`
  - In Page Objects, access them via `page.getByTestId('alerts-page')` or from a root locator (see example below).

- **Semantic and role-based selectors as a fallback**
  - When `data-testid` is not (yet) available, prefer semantic queries:
    - `page.getByRole('button', { name: /remediate/i })`
    - `page.getByRole('table', { name: /alerts/i })`
  - Use CSS or text selectors only when there is no reasonable semantic or test ID option.
  - Gradually migrate existing selectors (like those in `AlertsPage`) to `data-testid` as we touch those areas.

- **Expose key locators for reuse**
  - Expose **key elements** as public `readonly` properties or as getters:
    - Things other pages or tests may need (tables, drawers, banners, spinners).
  - Keep **low-level** locators (like cell indices or implementation details) private and wrap them in helper methods instead.

## Standard Page class structure

Every Page Object should follow this general structure:

1. **Imports** from `@playwright/test` and `BasePage`.
2. **Class declaration** `FooPage extends BasePage`.
3. **Locators**:
   - A top-level `root` locator where it makes sense (e.g. `alerts-page` root).
   - Public `readonly` locators or getters for key elements (tables, drawers, banners).
4. **Constructor** that accepts `Page`, calls `super(page)`, and initializes locators.
5. **Navigation** method (e.g. `goto()`) that uses `BasePage.navigate` and waits for the page to be ready.
6. **High-level helpers** that represent user actions or business flows (e.g. `clickFirstOpenAlertWithAutoRemediationOff`).

`BasePage` (`src/web/pages/BasePage.ts`) provides:

- **Navigation**: `navigate(path: string)` with `networkidle` waiting.
- **Visibility helpers**: `waitForVisible(locator)`, `waitForHidden(locator)`.
- **Utilities**: `getCurrentUrl()` for assertions and debugging.

## Example: `AlertsPage` pattern (recommended)

The `AlertsPage` encapsulates the alerts list and typical interactions a user performs there.

Recommended structure (simplified example, based on the `AlertsPage` responsibilities):

```ts
import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AlertsPage extends BasePage {
  readonly root: Locator;
  readonly alertsTable: Locator;
  readonly loadingState: Locator;

  constructor(page: Page) {
    super(page);

    // Root of the page
    this.root = page.getByTestId('alerts-page');

    // Key UI parts scoped under the root
    this.alertsTable = this.root.getByTestId('alerts-table');
    this.loadingState = this.root.getByTestId('alerts-loading');
  }

  async goto(): Promise<void> {
    await this.navigate('/alerts');
    await this.waitForLoaded();
  }

  async waitForLoaded(timeout = 30_000): Promise<void> {
    // Loading may already be gone; best-effort wait
    await this.loadingState.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  get alertRows(): Locator {
    return this.alertsTable.getByTestId('alert-row');
  }

  async getAlertCount(): Promise<number> {
    return this.alertRows.count();
  }

  async clickAlertByIndex(index: number): Promise<void> {
    await this.alertRows.nth(index).click();
  }
}
```

Notes:

- The actual implementation in `src/web/pages/AlertsPage.ts` may still use role-based selectors (`aria-label`) today; new work should follow the **test ID–first** pattern above.
- Keep helper methods **high level** and focused on behavior (status changes, remediation flows), not on DOM shape.

## How tests use Page Objects via fixtures

Playwright fixtures in `fixtures/index.ts` wire `WebApp` into tests:

- `fixtures/index.ts`:
  - Exports `test` and `expect`.
  - Extends the base test with:
    - `app: WebApp` – encapsulates UI pages.
    - `api: ApiClient` – encapsulates API calls.
  - `WebApp` (`src/web/WebApp.ts`) exposes the pages as properties:
    - `app.login`
    - `app.alerts`
    - `app.alertDetail`

Example fixture setup (abridged from `fixtures/index.ts`):

```ts
import { test as base, expect } from '@playwright/test';
import { WebApp } from '../src/web/WebApp';

export const test = base.extend<{
  app: WebApp;
}>({
  app: async ({ page }, use) => {
    await use(new WebApp(page));
  },
});

export { expect };
```

### Example UI test using `alertsPage`

From `tests/ui/alert-manual-remediation.spec.ts`:

```ts
import { test, expect } from '../../fixtures';

test.describe('Alert Manual Remediation — UI', () => {
  test('should manually remediate an alert through the full workflow', async ({ app }) => {
    // Navigate to alerts list
    await app.alerts.goto();
    await expect(
      app.alerts.alertsTable,
      'Alerts table should be visible after navigation',
    ).toBeVisible({ timeout: 30_000 });

    // Find first alert with status OPEN and autoRemediate: false
    const index = await app.alerts.clickFirstAlertByStatusAndAutoRemediate('Open', false);
    expect(index).toBeGreaterThanOrEqual(0);

    // Continue flow via AlertDetailPage helpers...
    await expect(
      app.alertDetail.drawerRoot,
      'Alert detail drawer should be visible after clicking an alert row',
    ).toBeVisible({ timeout: 15_000 });
    // ...
  });
});
```

Key points:

- Tests interact with **page objects only through the `app` fixture** (not directly with `page`), except for very specialized cases.
- Tests read like a **script of user intent**, using high-level methods from pages.

## Logging and Playwright steps

For UI flows we combine **structured logging** with **Playwright steps**:

- **Logger**
  - Use the shared Winston logger from `src/logger.ts` instead of `console.log` / `console.warn`.
  - Log normal operations with `logger.info` / `logger.debug` (navigation, expected user actions, polling progress).
  - Log exceptional events with `logger.warn` / `logger.error` (unexpected states, failures, thrown errors).
  - Logs go to stdout/stderr and are visible in `docker compose logs -f`.

- **`@step` decorator for Page Objects**
  - High-level Page Object methods that represent a user flow should use `@step('Description')` from `src/test/stepDecorator`.
  - The decorator:
    - Logs an `info` entry with the step message and arguments.
    - Wraps the method body in `test.step(...)` so it appears as a named step in Playwright reports and traces.
    - Logs an `error` entry if the method throws, then rethrows so the test still fails.
  - Examples:
    - `LoginPage.login`, `LoginPage.goto`
    - `AlertsPage.goto`, `AlertsPage.clickFirstAlertByStatusAndAutoRemediate`
    - `AlertDetailPage.changeStatus`, `AlertDetailPage.remediate`, `AlertDetailPage.addComment`

- **Rules**
  - Page Objects and tests **must not** use `console.*`; always rely on `logger` or the `@step` decorator.
  - Avoid logging secrets or sensitive data (tokens, credentials, full payloads); prefer IDs, counts, and statuses.
  - Tests should stay focused on behavior/assertions; logging is there to aid debugging and observability.

## Best practices and anti-patterns

### Assertions instead of raw waits

- **Use Playwright assertions for meaningful UI state**: When you are "waiting" for something that is really an expectation (status label changes, button becomes enabled, drawer opens, etc.), write it as an `expect` on a locator with a clear, human-readable message.
- **Always include an assertion message in tests**: Every `expect` in tests should pass a second argument string that explains the expectation, for example `expect(value, 'value should equal the answer to everything').toBe(42);`.
- **Let Page Objects expose locators, not opaque waits**: Page Objects should surface the relevant locators (for example `statusLabel`); tests should own the assertions on those locators instead of calling `waitForX` helpers.

Before (opaque wait helper in the test):

```ts
await app.alertDetail.waitForStatusText('Awaiting User Verification', 120_000);
```

After (explicit assertion with message):

```ts
const { statusLabel } = app.alertDetail;

await expect(
  statusLabel,
  'Status should become Awaiting User Verification',
).toHaveText(/Awaiting User Verification/i, { timeout: 120_000 });
```

- **Internal waits are still fine**: Page Objects (and `BasePage`) can still use internal waits for navigation and network synchronization, but they should avoid hiding important test assertions behind generic wait helpers.

### Do

- **Do** keep selectors and raw Playwright waits (`waitForSelector`, `waitForTimeout`, `locator.waitFor`) inside Page Objects (and `BasePage`), not in specs; in tests, express UI expectations as `expect(locator, 'message').to…` (see [Assertions instead of raw waits](#assertions-instead-of-raw-waits)), and always provide a message for every assertion.
- **Do** expose a small set of high-level methods that represent user actions and flows.
- **Do** use `data-testid` where possible and prefer `getByTestId` over CSS/text selectors.
- **Do** use semantic selectors (`getByRole`, `getByLabelText`, etc.) when no test IDs exist yet.
- **Do** add or update test IDs in the app when you notice brittle selectors during test work.
- **Do** keep `WebApp` as the single entry point to UI pages in fixtures.
- **Do** provide clear, human-readable messages on important UI assertions so failures are easy to understand.

### Don’t

- **Don’t** call `page.goto` or `page.locator` directly in tests for common flows; add or extend a Page Object instead.
- **Don’t** assert deeply inside Page Object methods (besides sanity checks); keep assertions in tests (see [Assertions instead of raw waits](#assertions-instead-of-raw-waits)).
- **Don’t** introduce `waitForX` helpers that hide important expectations; prefer explicit `expect(locator, 'message').to…` assertions in tests using locators exposed by Page Objects.
- **Don’t** rely on fragile selectors (deep CSS chains, text that is likely to change) when a test ID can be added.
- **Don’t** duplicate complex selector logic across multiple pages or tests.
- **Don’t** mix API and UI concerns in the same Page Object; keep API logic in clients under `src/api/`.

## Keeping this guide up to date

- When you:
  - Add a new Page Object under `src/web/pages/`,
  - Change how selectors or fixtures work,
  - Introduce new shared patterns in `BasePage` or `WebApp`,
- **Then**:
  - Update `AGENTS.md` in the same pull request.
  - Add or adjust short examples so future contributors can follow the new pattern.

Treat this file as the **single source of truth** for our Playwright Page Object and test patterns.

