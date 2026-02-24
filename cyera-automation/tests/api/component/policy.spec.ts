import { test, expect } from '../../../fixtures';

test.describe('Policy API — Component Tests', () => {
  test('GET /api/policy-config returns 200', async ({ api }) => {
    const config = await api.policy.getConfig();

    expect(config).toBeTruthy();
  });

  test('Response contains expected policy fields', async ({ api }) => {
    const config = await api.policy.getConfig();

    // Verify the top-level structure
    expect(config.assets).toBeTruthy();
    expect(config.enums).toBeTruthy();
    expect(config.labels).toBeTruthy();

    // Verify assets section
    expect(config.assets.cloudProviders).toBeTruthy();
    expect(Array.isArray(config.assets.cloudProviders)).toBe(true);
    expect(config.assets.cloudProviders.length).toBeGreaterThan(0);

    expect(config.assets.cloudDataStoresByProvider).toBeTruthy();
    expect(config.assets.saasTools).toBeTruthy();
    expect(Array.isArray(config.assets.saasTools)).toBe(true);

    // Verify enums section
    expect(config.enums.violationTypes).toBeTruthy();
    expect(Array.isArray(config.enums.violationTypes)).toBe(true);
    expect(config.enums.violationTypes.length).toBeGreaterThan(0);

    expect(config.enums.severities).toBeTruthy();
    expect(config.enums.severities).toEqual(
      expect.arrayContaining(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    );

    expect(config.enums.alertStatuses).toBeTruthy();
    expect(Array.isArray(config.enums.alertStatuses)).toBe(true);
    expect(config.enums.alertStatuses.length).toBeGreaterThan(0);

    expect(config.enums.remediationTypes).toBeTruthy();
    expect(config.enums.remediationPriorities).toBeTruthy();
    expect(config.enums.remediationDueUnits).toBeTruthy();

    // Verify labels section exists
    expect(config.labels).toBeTruthy();
    expect(typeof config.labels).toBe('object');
  });
});
