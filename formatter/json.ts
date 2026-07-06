import type { Report } from '../core/reporter/reporter';

/**
 * CI連携を見据えた構造化出力。
 * `compact`フォーマットは今回のスコープ外（将来対応予定）。
 */
export function formatJson(report: Report): string {
  return JSON.stringify(report, null, 2) + '\n';
}
