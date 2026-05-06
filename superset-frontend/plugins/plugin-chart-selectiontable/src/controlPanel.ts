import {
  validateInteger,
  validateNonEmpty,
} from '@superset-ui/core';
import {
  ControlPanelConfig,
  ControlPanelState,
} from '@superset-ui/chart-controls';
import { translate } from './translation';

type DatasourceColumn = {
  column_name: string;
  verbose_name?: string;
};

function isDatasourceColumn(column: unknown): column is DatasourceColumn {
  return (
    typeof column === 'object' &&
    column !== null &&
    'column_name' in column &&
    typeof (column as { column_name: unknown }).column_name === 'string'
  );
}

const columnChoices = (state: ControlPanelState) => {
  const datasourceColumns =
    state.datasource && 'columns' in state.datasource
      ? state.datasource.columns
      : [];

  return (Array.isArray(datasourceColumns) ? datasourceColumns : [])
    .filter(isDatasourceColumn)
    .map(column => [
      column.column_name,
      column.verbose_name || column.column_name,
    ]);
};

function validatePageSize(value: unknown): string | false {
  const integerValidation = validateInteger(value);
  if (integerValidation) {
    return integerValidation;
  }

  if (Number(value) < 1) {
    return translate('Page Size must be at least 1.');
  }

  return false;
}

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: translate('Query'),
      expanded: true,
      controlSetRows: [['columns']],
    },
    {
      label: translate('Selection'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'rowIdColumn',
            config: {
              type: 'SelectControl',
              label: translate('Row ID Column'),
              description: translate(
                'Column that uniquely identifies each row.',
              ),
              mapStateToProps: (state: ControlPanelState) => ({
                choices: columnChoices(state),
              }),
              validators: [validateNonEmpty],
              default: undefined,
            },
          },
        ],
        [
          {
            name: 'emitFilterColumn',
            config: {
              type: 'SelectControl',
              label: translate('Emit Filter Column'),
              description: translate(
                'Column to emit in cross-filtering. Defaults to Row ID Column.',
              ),
              mapStateToProps: (state: ControlPanelState) => ({
                choices: columnChoices(state),
              }),
              clearable: true,
              default: undefined,
            },
          },
        ],
        [
          {
            name: 'enableCrossFilter',
            config: {
              type: 'CheckboxControl',
              label: translate('Enable Cross-Filter'),
              default: true,
              renderTrigger: true,
              description: translate(
                'Emit selections as cross-filters to other charts.',
              ),
            },
          },
          {
            name: 'keepSelectionOnDataRefresh',
            config: {
              type: 'CheckboxControl',
              label: translate('Keep Selection on Data Refresh'),
              default: true,
              renderTrigger: true,
              description: translate(
                'Preserve selected keys when data refreshes.',
              ),
            },
          },
        ],
        [
          {
            name: 'pageSize',
            config: {
              type: 'TextControl',
              label: translate('Page Size'),
              default: 25,
              isInt: true,
              validators: [validatePageSize],
              renderTrigger: true,
              description: translate('Rows per page for the table.'),
            },
          },
          {
            name: 'showSearch',
            config: {
              type: 'CheckboxControl',
              label: translate('Show Search'),
              default: false,
              renderTrigger: true,
              description: translate(
                'Enable client-side search across visible columns.',
              ),
            },
          },
        ],
        [
          {
            name: 'redirectDashboardUrl',
            config: {
              type: 'TextControl',
              label: translate('Redirect Dashboard URL'),
              default: undefined,
              renderTrigger: true,
              description: translate(
                'Optional dashboard URL or path to navigate to, such as /superset/dashboard/1/.',
              ),
            },
          },
          {
            name: 'redirectFilterChartId',
            config: {
              type: 'TextControl',
              label: translate('Redirect Filter Chart ID'),
              default: '',
              renderTrigger: true,
              description: translate(
                'Optional dashboard filter chart id. When set, Navigate writes Superset preselect_filters for this chart and the emitted filter column.',
              ),
            },
          },
        ],
        [
          {
            name: 'redirectKey',
            config: {
              type: 'TextControl',
              label: translate('Redirect Key'),
              default: '',
              renderTrigger: true,
              description: translate(
                'Fallback query parameter key when Redirect Filter Chart ID is not set. Defaults to "selectedRowIds".',
              ),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
