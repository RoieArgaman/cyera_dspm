import { test, expect } from '../../../fixtures';

test.describe('Scans API — Component Tests', () => {
  test('POST start scan returns 201 and scan ID', async ({ api }) => {
    const scan = await api.scans.start();

    expect(scan).toBeTruthy();
    expect(scan.id).toBeTruthy();
    expect(scan.status).toBeTruthy();
    expect(scan.startedAt).toBeTruthy();
  });

  test('GET scan by ID returns scan object', async ({ api }) => {
    // Start a scan first so we have a known scan ID
    const started = await api.scans.start();
    expect(started.id).toBeTruthy();

    const scan = await api.scans.getById(started.id);

    expect(scan).toBeTruthy();
    expect(scan.id).toBe(started.id);
    expect(scan.status).toBeTruthy();
    expect(scan.startedAt).toBeTruthy();
  });

  test('GET scan status reflects progress', async ({ api }) => {
    // Start a scan
    const started = await api.scans.start();
    expect(started.id).toBeTruthy();

    // Immediately check status — should be RUNNING
    const statusResponse = await api.scans.getStatus();
    expect(statusResponse).toBeTruthy();
    expect(statusResponse.status).toBeTruthy();
    // The status should be either RUNNING (scan just started) or IDLE (scan completed very fast)
    expect(['IDLE', 'RUNNING']).toContain(statusResponse.status);
  });
});
