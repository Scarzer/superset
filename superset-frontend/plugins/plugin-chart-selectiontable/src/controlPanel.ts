import {
  validateInteger,
  validateNonEmpty,
  withLabel,
} from '@superset-ui/core';
import {
  ControlPanelConfig,
  ControlPanelState,
} from '@superset-ui/chart-controls';
import rison from 'rison';
import { translate } from './translation';

type DatasourceColumn = {
  column_name: string;
  verbose_name?: string;
};

type DashboardSummary = {
  id: number;
  dashboard_title: string;
  url: string;
  changed_on_delta_humanized?: string;
};

type DashboardListResponse = {
  result?: DashboardSummary[];
};

const dashboardEndpoint = `/api/v1/dashboard/?q=${rison.encode({
  order_column: 'changed_on_delta_humanized',
  order_direction: 'desc',
  page: 0,
  page_size: 25,
  select_columns: [
    'id',
    'dashboard_title',
    'url',
    'changed_on_delta_humanized',
  ],
})}`;

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

function redirectDashboardMutator(response: DashboardListResponse) {
  const dashboards = Array.isArray(response.result) ? response.result : [];

  return dashboards.map(dashboard => ({
    value: dashboard.url || `/superset/dashboard/${dashboard.id}/`,
    label: dashboard.changed_on_delta_humanized
      ? `${dashboard.dashboard_title} (${dashboard.changed_on_delta_humanized})`
      : dashboard.dashboard_title,
  }));
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
              validators: [withLabel(validatePageSize, translate('Page Size'))],
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
              type: 'SelectAsyncControl',
              label: translate('Redirect Dashboard'),
              default: undefined,
              renderTrigger: true,
              allowClear: true,
              multi: false,
              dataEndpoint: dashboardEndpoint,
              mutator: redirectDashboardMutator,
              placeholder: translate('Select a dashboard'),
              onAsyncErrorMessage: translate('Error while fetching dashboards'),
              description: translate(
                'Optional dashboard to navigate to. Shows the 25 most recently changed dashboards you can access.',
              ),
            },
          },
          {
            name: 'redirectKey',
            config: {
              type: 'TextControl',
              label: translate('Redirect Key'),
              default: '',
              renderTrigger: true,
              description: translate(
                'Optional query parameter key for selected row IDs in the redirect URL. Defaults to "selectedRowIds".',
              ),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
