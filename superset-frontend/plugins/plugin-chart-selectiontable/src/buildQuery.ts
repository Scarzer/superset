import { buildQueryContext, QueryObject } from '@superset-ui/core';
import { SelectionTableFormData } from './types';

export default function buildQuery(formData: SelectionTableFormData) {
  const requestedColumns = Array.isArray(formData.columns)
    ? [...formData.columns]
    : [];

  if (
    formData.rowIdColumn &&
    !requestedColumns.includes(formData.rowIdColumn)
  ) {
    requestedColumns.push(formData.rowIdColumn);
  }
  if (
    formData.emitFilterColumn &&
    !requestedColumns.includes(formData.emitFilterColumn)
  ) {
    requestedColumns.push(formData.emitFilterColumn);
  }

  return buildQueryContext(formData, (baseQueryObject: QueryObject) => [
    {
      ...baseQueryObject,
      columns:
        requestedColumns.length > 0
          ? requestedColumns
          : baseQueryObject.columns,
    },
  ]);
}
