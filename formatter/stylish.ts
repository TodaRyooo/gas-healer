import * as path from 'node:path';
import type { Report } from '../core/reporter/reporter';
import type { Severity } from '../types/rule';

function severityLabel(severity: Severity): string {
  switch (severity) {
    case 'ERROR':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'info';
  }
}

/** ESLint風の人間可読なコンソール出力を生成する */
export function formatStylish(report: Report, cwd: string = process.cwd()): string {
  if (report.files.length === 0) {
    return '違反は見つかりませんでした。\n';
  }

  const lines: string[] = [];

  for (const file of report.files) {
    lines.push(path.relative(cwd, file.filePath));
    for (const v of file.violations) {
      lines.push(`  ${v.line}:${v.column}  ${severityLabel(v.severity)}  ${v.message}  (${v.ruleId})`);
    }
    lines.push('');
  }

  const total = report.errorCount + report.warningCount + report.infoCount;
  lines.push(
    `${total} problems (${report.errorCount} errors, ${report.warningCount} warnings, ${report.infoCount} info)`
  );

  return lines.join('\n') + '\n';
}
