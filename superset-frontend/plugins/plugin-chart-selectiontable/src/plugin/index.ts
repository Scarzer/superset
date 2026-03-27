import { Behavior, ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from '../buildQuery';
import controlPanel from '../controlPanel';
import { SelectionTableFormData } from '../types';
import { translate } from '../translation';

const thumbnail =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="#f0f0f0"/><rect x="10" y="16" width="100" height="10" fill="#bfbfbf"/><rect x="10" y="36" width="100" height="10" fill="#d9d9d9"/><rect x="10" y="56" width="100" height="10" fill="#d9d9d9"/></svg>';

const metadata = new ChartMetadata({
  category: translate('Table'),
  description: translate('Table with checkbox-based multi-select and cross-filtering.'),
  name: translate('Selection Table'),
  tags: [translate('Table'), translate('Cross-filter')],
  thumbnail,
  behaviors: [Behavior.InteractiveChart],
});

export default class SelectionTableChartPlugin extends ChartPlugin<SelectionTableFormData> {
  constructor() {
    super({
      metadata,
      buildQuery,
      controlPanel,
      loadChart: () => import('../Chart'),
    });
    // Provide a default key so registration works even if configure() isn't called.
    this.configure({ key: 'selection_table' });
  }
}
