import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, Input, Table } from 'antd';
import { ChartProps, DataRecord, DataRecordValue } from '@superset-ui/core';
import { SelectionTableFormData } from './types';
import { translate } from './translation';

type RowWithKey = DataRecord & {
  __rowKey: string;
  __missingRowId?: boolean;
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
};

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function serializeDataRecordValue(value: DataRecordValue) {
  return `${typeof value}:${String(value)}`;
}

export default function SelectionTableChart(
  props: ChartProps<SelectionTableFormData>,
) {
  const {
    formData,
    width,
    height,
    hooks,
    queriesData = [],
    isRefreshing = false,
  } = props;
  const setDataMask = hooks?.setDataMask;
  const data = queriesData[0]?.data || [];
  const {
    rowIdColumn,
    emitFilterColumn = rowIdColumn,
    enableCrossFilter,
    pageSize,
    showSearch,
    keepSelectionOnDataRefresh,
    redirectDashboardUrl,
    redirectKey,
  } = formData;

  const [searchText, setSearchText] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const hasInitializedEmissionRef = useRef(false);
  const lastEmittedSignatureRef = useRef<string | null>(null);
  const lastWarningRef = useRef<{ missing: number; duplicate: number } | null>(
    null,
  );

  const { rows, validKeys, duplicateKeys, missingCount } = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    let missing = 0;

    const nextRows = (data as DataRecord[]).map((row, index) => {
      const rawKey = rowIdColumn ? row[rowIdColumn] : undefined;
      if (rawKey === null || rawKey === undefined) {
        missing += 1;
        return {
          ...row,
          __rowKey: `__missing__${index}`,
          __missingRowId: true,
        } as RowWithKey;
      }

      const key = String(rawKey);
      if (seen.has(key)) {
        duplicates.add(key);
      } else {
        seen.add(key);
      }

      return {
        ...row,
        __rowKey: key,
      } as RowWithKey;
    });

    return {
      rows: nextRows,
      validKeys: seen,
      duplicateKeys: duplicates,
      missingCount: missing,
    };
  }, [data, rowIdColumn]);

  useEffect(() => {
    if (!rowIdColumn) {
      return;
    }

    const previous = lastWarningRef.current;
    if (!previous || previous.missing !== missingCount) {
      if (missingCount > 0) {
        // Missing keys are ignored for selection by disabling their checkboxes.
        // This avoids emitting unstable filters.
        // eslint-disable-next-line no-console
        console.warn(
          `[SelectionTable] ${missingCount} row(s) missing '${rowIdColumn}'. Those rows are not selectable.`,
        );
      }
    }

    if (!previous || previous.duplicate !== duplicateKeys.size) {
      if (duplicateKeys.size > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[SelectionTable] Duplicate values found in '${rowIdColumn}'. Selection keys must be unique for stable cross-filtering.`,
        );
      }
    }

    lastWarningRef.current = {
      missing: missingCount,
      duplicate: duplicateKeys.size,
    };
  }, [rowIdColumn, missingCount, duplicateKeys]);

  const emitValuesByRowKey = useMemo(() => {
    const map = new Map<string, DataRecordValue>();
    if (!emitFilterColumn) {
      return map;
    }

    for (const row of rows) {
      const emitValue = row[emitFilterColumn] as DataRecordValue;
      if (emitValue !== null && emitValue !== undefined) {
        map.set(row.__rowKey, emitValue);
      }
    }

    return map;
  }, [rows, emitFilterColumn]);

  const emitSelection = useCallback(
    (nextSet: Set<string>) => {
      if (!enableCrossFilter || !setDataMask || !emitFilterColumn) {
        return;
      }

      const emittedValues =
        emitFilterColumn === rowIdColumn
          ? (Array.from(nextSet) as DataRecordValue[])
          : Array.from(nextSet)
              .map(rowKey => emitValuesByRowKey.get(rowKey))
              .filter(
                (value): value is Exclude<DataRecordValue, null | undefined> =>
                  value !== null && value !== undefined,
              );

      const dedupedValues = Array.from(
        new Map(
          emittedValues.map(value => [serializeDataRecordValue(value), value]),
        ).values(),
      );

      const signature = dedupedValues
        .map(serializeDataRecordValue)
        .sort()
        .join('|');
      const emissionSignature = `${emitFilterColumn}:${signature}`;

      if (
        hasInitializedEmissionRef.current &&
        lastEmittedSignatureRef.current === emissionSignature
      ) {
        return;
      }

      if (!hasInitializedEmissionRef.current) {
        hasInitializedEmissionRef.current = true;
        if (dedupedValues.length === 0) {
          return;
        }
      }

      lastEmittedSignatureRef.current = emissionSignature;

      if (dedupedValues.length === 0) {
        setDataMask({
          // Empty filterState + extraFormData clears the dashboard filter.
          filterState: { value: null, selectedValues: null },
          extraFormData: {},
        });
        return;
      }

      setDataMask({
        // Superset 6.x cross-filtering expects extraFormData.filters with IN op.
        // filterState carries selected values for UI state and drill behavior.
        extraFormData: {
          filters: [
            {
              col: emitFilterColumn,
              op: 'IN',
              val: dedupedValues,
            },
          ],
        },
        filterState: {
          value: dedupedValues,
          selectedValues: dedupedValues,
        },
      });
    },
    [
      enableCrossFilter,
      setDataMask,
      emitFilterColumn,
      rowIdColumn,
      emitValuesByRowKey,
    ],
  );

  const updateSelection = useCallback(
    (nextSet: Set<string>) => {
      setSelectedKeys(prev => {
        if (setsEqual(prev, nextSet)) {
          return prev;
        }
        return nextSet;
      });
      emitSelection(nextSet);
    },
    [emitSelection],
  );

  const onSelectionChange = useCallback(
    (nextKeys: React.Key[]) => {
      const normalized = nextKeys.map(key => String(key));
      updateSelection(new Set(normalized));
    },
    [updateSelection],
  );

  const addKeys = useCallback(
    (keysToAdd: React.Key[]) => {
      const normalized = keysToAdd.map(key => String(key));
      setSelectedKeys(prev => {
        const next = new Set(prev);
        for (const key of normalized) {
          next.add(key);
        }
        if (setsEqual(prev, next)) {
          return prev;
        }
        emitSelection(next);
        return next;
      });
    },
    [emitSelection],
  );

  const clearSelection = useCallback(() => {
    updateSelection(new Set());
  }, [updateSelection]);

  const buildNavigateUrl = useCallback(() => {
    if (!redirectDashboardUrl || redirectDashboardUrl.trim() === '') {
      return null;
    }

    const selected = Array.from(selectedKeys);
    if (selected.length === 0) {
      return redirectDashboardUrl;
    }

    const payload = JSON.stringify(selected);

    try {
      const url = new URL(redirectDashboardUrl, window.location.origin);
      url.searchParams.set(redirectKey || 'selectedRowIds', payload);
      return url.toString();
    } catch {
      const separator = redirectDashboardUrl.includes('?') ? '&' : '?';
      return `${redirectDashboardUrl}${separator}${redirectKey || 'selectedRowIds'}=${encodeURIComponent(
        payload,
      )}`;
    }
  }, [redirectDashboardUrl, selectedKeys, redirectKey]);

  const onNavigate = useCallback(() => {
    const url = buildNavigateUrl();
    if (url) {
      window.location.assign(url);
    }
  }, [buildNavigateUrl]);

  useEffect(() => {
    if (!rowIdColumn) {
      return;
    }

    if (!keepSelectionOnDataRefresh) {
      if (selectedKeys.size > 0) {
        updateSelection(new Set());
      }
      return;
    }

    const next = new Set(
      Array.from(selectedKeys).filter(key => validKeys.has(key)),
    );

    if (!setsEqual(selectedKeys, next)) {
      updateSelection(next);
    }
  }, [
    data,
    rowIdColumn,
    keepSelectionOnDataRefresh,
    validKeys,
    selectedKeys,
    updateSelection,
  ]);

  useEffect(() => {
    if (enableCrossFilter) {
      emitSelection(selectedKeys);
    }
  }, [enableCrossFilter, emitFilterColumn, emitSelection, selectedKeys]);

  const selectedRowKeys = useMemo(
    () => Array.from(selectedKeys),
    [selectedKeys],
  );

  const columns = useMemo(() => {
    const configuredColumns = Array.isArray(formData.columns)
      ? formData.columns.filter(Boolean)
      : [];

    const columnKeys =
      configuredColumns.length > 0
        ? Array.from(new Set(configuredColumns))
        : Object.keys(rows[0] || {}).filter(key => !key.startsWith('__'));

    if (columnKeys.length === 0) {
      return [];
    }

    return columnKeys.map(key => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      render: (value: unknown) =>
        value === null || value === undefined ? '' : String(value),
    }));
  }, [formData.columns, rows]);

  const filteredRows = useMemo(() => {
    if (!showSearch || searchText.trim() === '') {
      return rows;
    }

    const term = searchText.toLowerCase();
    return rows.filter(row =>
      Object.entries(row).some(([key, value]) => {
        if (key.startsWith('__')) {
          return false;
        }
        if (value === null || value === undefined) {
          return false;
        }
        return String(value).toLowerCase().includes(term);
      }),
    );
  }, [rows, showSearch, searchText]);

  if (!rowIdColumn) {
    return (
      <div style={{ ...styles.container, width, height }}>
        <div style={styles.metaText}>
          {translate('Please select a Row ID Column in the chart controls.')}
        </div>
      </div>
    );
  }

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: onSelectionChange,
    selections: [
      {
        key: 'select-page',
        text: translate('Select all on page'),
        onSelect: (changeableRowKeys: React.Key[]) => {
          addKeys(changeableRowKeys);
        },
      },
    ],
    getCheckboxProps: (record: RowWithKey) => ({
      disabled: record.__missingRowId || duplicateKeys.has(record.__rowKey),
    }),
  };

  return (
    <div style={{ ...styles.container, width, height }}>
      <div style={styles.toolbar}>
        {showSearch && (
          <Input
            placeholder={translate('Search')}
            value={searchText}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setSearchText(event.target.value)
            }
            allowClear
            style={{ maxWidth: 240 }}
          />
        )}
        <div style={styles.metaText}>
          {translate('Selected')}: {selectedKeys.size}
        </div>
        <Button onClick={clearSelection} disabled={selectedKeys.size === 0}>
          {translate('Clear')}
        </Button>
        <Button
          onClick={onNavigate}
          disabled={!redirectDashboardUrl || redirectDashboardUrl.trim() === ''}
        >
          {translate('Navigate')}
        </Button>
      </div>
      <Table<RowWithKey>
        rowKey="__rowKey"
        dataSource={filteredRows}
        columns={columns}
        rowSelection={rowSelection}
        pagination={{ pageSize, showSizeChanger: false }}
        size="small"
        loading={isRefreshing && rows.length === 0}
        sticky
      />
    </div>
  );
}
