import { AlertsClient } from './clients/AlertsClient';
import { ScansClient } from './clients/ScansClient';
import { PolicyClient } from './clients/PolicyClient';
import { AdminClient } from './clients/AdminClient';

export class ApiClient {
  public readonly alerts: AlertsClient;
  public readonly scans: ScansClient;
  public readonly policy: PolicyClient;
  public readonly admin: AdminClient;

  constructor(baseUrl: string, token: string) {
    this.alerts = new AlertsClient(baseUrl, token);
    this.scans = new ScansClient(baseUrl, token);
    this.policy = new PolicyClient(baseUrl, token);
    this.admin = new AdminClient(baseUrl, token);
  }
}
