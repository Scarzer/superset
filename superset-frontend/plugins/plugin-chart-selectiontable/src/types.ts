import { QueryFormData, DataRecord } from '@superset-ui/core';

export interface SelectionTableFormData extends QueryFormData {
  columns?: string[];
  rowIdColumn: string;
  emitFilterColumn?: string;
  enableCrossFilter: boolean;
  pageSize: number;
  showSearch: boolean;
  keepSelectionOnDataRefresh: boolean;
  redirectDashboardUrl?: string;
  redirectKey?: string;
}

export type SelectionTableData = DataRecord[];
