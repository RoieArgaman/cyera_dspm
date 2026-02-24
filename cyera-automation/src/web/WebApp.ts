import type { Page } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AlertsPage } from './pages/AlertsPage';
import { AlertDetailPage } from './pages/AlertDetailPage';

export class WebApp {
  public readonly page: Page;
  public readonly login: LoginPage;
  public readonly alerts: AlertsPage;
  public readonly alertDetail: AlertDetailPage;

  constructor(page: Page) {
    this.page = page;
    this.login = new LoginPage(page);
    this.alerts = new AlertsPage(page);
    this.alertDetail = new AlertDetailPage(page);
  }
}
