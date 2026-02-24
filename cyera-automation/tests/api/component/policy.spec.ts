import { test, expect } from '../../../fixtures';
import { getPolicyConfig } from '../../../src/api';

test.describe('Policy API — Component Tests', () => {
  test('GET /api/policy-config returns 200', async ({ api }) => {
    const config = await getPolicyConfig(api);
    expect(config).toBeTruthy();
  });

  test('Response contains expected policy fields', async ({ api }) => {
    const config = await getPolicyConfig(api);

    expect(config.assets).toBeTruthy();
    expect(config.enums).toBeTruthy();
    expect(config.labels).toBeTruthy();

    expect(Array.isArray(config.assets.cloudProviders)).toBe(true);
    expect(config.assets.cloudProviders.length).toBeGreaterThan(0);
    expect(config.assets.cloudDataStoresByProvider).toBeTruthy();
    expect(Array.isArray(config.assets.saasTools)).toBe(true);

    expect(Array.isArray(config.enums.violationTypes)).toBe(true);
    expect(config.enums.violationTypes.length).toBeGreaterThan(0);
    expect(config.enums.severities).toEqual(
      expect.arrayContaining(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    );
    expect(Array.isArray(config.enums.alertStatuses)).toBe(true);
    expect(config.enums.alertStatuses.length).toBeGreaterThan(0);
    expect(config.enums.remediationTypes).toBeTruthy();
    expect(config.enums.remediationPriorities).toBeTruthy();
    expect(config.enums.remediationDueUnits).toBeTruthy();

    expect(typeof config.labels).toBe('object');
  });
});
