export interface PolicyConfig {
  assets: {
    cloudProviders: string[];
    cloudDataStoresByProvider: Record<string, string[]>;
    saasTools: string[];
  };
  enums: {
    violationTypes: string[];
    severities: string[];
    dataClassificationCategories: string[];
    remediationTypes: string[];
    remediationPriorities: string[];
    remediationDueUnits: string[];
    alertStatuses: string[];
  };
  labels: Record<string, unknown>;
}

