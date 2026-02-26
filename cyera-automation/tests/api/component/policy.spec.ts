import { test, expect } from '../../../fixtures';
import type { AlertStatus } from '../../../src/api/types';
import { lifecycleTableStatuses } from '../../alertStatusTestUtils';

test.describe('Policy API — Component Tests', () => {
  test('GET /api/policy-config returns 200', async ({ api }) => {
    const config = await api.policy.getConfig();
    expect(config, 'Policy config should be returned').toBeTruthy();
  });

  test('Response contains expected policy fields', async ({ api }) => {
    const config = await api.policy.getConfig();

    expect(config.assets, 'Policy config should include assets section').toBeTruthy();
    expect(config.enums, 'Policy config should include enums section').toBeTruthy();
    expect(config.labels, 'Policy config should include labels section').toBeTruthy();

    expect(Array.isArray(config.assets.cloudProviders), 'cloudProviders should be an array').toBe(true);
    expect(config.assets.cloudProviders.length, 'cloudProviders should not be empty').toBeGreaterThan(0);
    expect(
      config.assets.cloudDataStoresByProvider,
      'cloudDataStoresByProvider should be present',
    ).toBeTruthy();
    expect(Array.isArray(config.assets.saasTools), 'saasTools should be an array').toBe(true);

    expect(Array.isArray(config.enums.violationTypes), 'violationTypes should be an array').toBe(true);
    expect(config.enums.violationTypes.length, 'violationTypes should not be empty').toBeGreaterThan(0);
    expect(
      config.enums.severities,
      'Severities enum should contain all standard severity levels',
    ).toEqual(expect.arrayContaining(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']));
    expect(Array.isArray(config.enums.alertStatuses), 'alertStatuses should be an array').toBe(true);
    expect(config.enums.alertStatuses.length, 'alertStatuses should not be empty').toBeGreaterThan(0);
    const expectedStatuses: AlertStatus[] = lifecycleTableStatuses;
    expect(
      config.enums.alertStatuses.sort(),
      'alertStatuses enum from policy-config should contain all backend AlertStatus values',
    ).toEqual(expect.arrayContaining(expectedStatuses));
    expect(config.enums.remediationTypes, 'remediationTypes should be present').toBeTruthy();
    expect(config.enums.remediationPriorities, 'remediationPriorities should be present').toBeTruthy();
    expect(config.enums.remediationDueUnits, 'remediationDueUnits should be present').toBeTruthy();

    expect(typeof config.labels, 'labels should be an object').toBe('object');
  });
});
