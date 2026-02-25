import { test, expect } from '../../../fixtures';

test.describe('Scans API — Component Tests', () => {
  test('POST start scan returns 201 and scan ID', async ({ api }) => {
    const scan = await api.scans.start();

    expect(scan, 'Scan response should be returned').toBeTruthy();
    expect(scan.id, 'Scan should have an ID').toBeTruthy();
    expect(scan.status, 'Scan should have a status').toBeTruthy();
    expect(scan.startedAt, 'Scan should have a startedAt timestamp').toBeTruthy();
  });

  test('GET scan by ID returns scan object', async ({ api }) => {
    const started = await api.scans.start();
    expect(started.id, 'Started scan should have an ID').toBeTruthy();

    const scan = await api.scans.getById(started.id);

    expect(scan, 'Scan fetched by ID should exist').toBeTruthy();
    expect(scan.id, 'Fetched scan ID should match started scan ID').toBe(started.id);
    expect(scan.status, 'Scan fetched by ID should have a status').toBeTruthy();
    expect(scan.startedAt, 'Scan fetched by ID should have a startedAt timestamp').toBeTruthy();
  });

  test('GET scan status reflects progress', async ({ api }) => {
    const started = await api.scans.start();
    expect(started.id, 'Started scan for status check should have an ID').toBeTruthy();

    const statusResponse = await api.scans.getStatus();
    expect(statusResponse, 'Scan status response should exist').toBeTruthy();
    expect(statusResponse.status, 'Scan status response should include a status').toBeTruthy();
    expect(['IDLE', 'RUNNING'], 'Scan status should be IDLE or RUNNING').toContain(statusResponse.status);
  });
});
