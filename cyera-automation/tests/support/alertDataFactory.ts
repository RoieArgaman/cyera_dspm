import type { CreateAlertPayload, CreateAlertOverrides } from '../../src/types';

export const alertDataFactory = {
  openAlert(overrides: CreateAlertOverrides = {}): CreateAlertPayload {
    const base: CreateAlertPayload = {
      status: 'OPEN',
      autoRemediate: false,
    };
    return { ...base, ...overrides };
  },
};

