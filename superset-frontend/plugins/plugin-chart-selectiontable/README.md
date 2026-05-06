# Superset Selection Table Plugin

A custom Superset 6.x visualization plugin that renders an Ant Design table with checkbox multi-row selection and emits cross-filters via `dataMask`.

## Requirements

- Apache Superset 6.x
- `superset-frontend` build environment (Yarn)
- Node.js compatible with your Superset checkout

## Build the Plugin

From this plugin repo:

```bash
yarn install
yarn build
```

## Add to a Custom Superset Installation

### Option A: `yarn link` (fast local iteration)

1) Link the plugin from this repo:

```bash
yarn link
```

2) In your Superset repo (inside `superset-frontend`), link it in:

```bash
yarn link superset-selection-table
```

3) Register the plugin in your Superset preset (typically `superset-frontend/src/visualizations/presets/MainPreset.ts`):

```ts
import SelectionTableChartPlugin from 'superset-selection-table';

new SelectionTableChartPlugin()
  .configure({ key: 'selection_table' })
  .register();
```

4) Restart the frontend build:

```bash
yarn start
```

### Option B: Local workspace package

If your Superset repo is a Yarn workspace or you want a local package dependency:

1) Copy this plugin into a subfolder such as `superset-frontend/plugins/superset-selection-table`.

2) Add it to `superset-frontend/package.json`:

```json
{
  "dependencies": {
    "superset-selection-table": "workspace:*"
  }
}
```

3) Register the plugin as in Option A, step 3.

4) Rebuild or start the frontend:

```bash
yarn install
yarn start
```

## Usage

1) Create a new chart and select **Selection Table** from the visualization picker.
2) Set **Row ID Column** (required) and **Emit Filter Column** (optional).
3) Enable **Cross-Filter** (default on).
4) Optional: Set **Redirect Dashboard URL** to enable the Navigate button. Enter a dashboard URL or path such as `/superset/dashboard/1/`.
5) Optional: Set **Redirect Filter Chart ID** to have Navigate write a Superset-compatible `preselect_filters` query parameter using the emitted filter column and selected values.
6) If **Redirect Filter Chart ID** is left empty, the plugin falls back to appending the selected filter values as a JSON array under **Redirect Key**.
7) Use row checkboxes to select values; selection emits `IN (...)` filters to other charts on the dashboard.

## Notes

- Large selections can bloat dashboard state/URLs because selected values are stored in `dataMask`.
- For large datasets, consider server-side pagination or virtualization if needed.
- Downstream charts must have the `emitFilterColumn` in their dataset; otherwise the filter will not apply.
