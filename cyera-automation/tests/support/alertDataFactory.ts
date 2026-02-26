import type { CreateAlertPayload, CreateAlertOverrides } from '../../src/api/types';

export const alertDataFactory = {
  openAlert(overrides: CreateAlertOverrides = {}): CreateAlertPayload {
    const base: CreateAlertPayload = {
      status: 'OPEN',
      autoRemediate: false,
    };
    return { ...base, ...overrides };
  },
};

