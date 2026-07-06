import * as path from 'node:path';
import type { Report } from '../core/reporter/reporter';

/** ESLint風の人間可読なコンソール出力を生成する */
export function formatStylish(report: Report, cwd: string = process.cwd()): string {
  if (report.files.length === 0) {
    return '違反は見つかりませんでした。\n';
  }

  const lines: string[] = [];

  for (const file of report.files) {
    lines.push(path.relative(cwd, file.filePath));
    for (const v of file.violations) {
      lines.push(`  ${v.line}:${v.column}  ${v.severity}  ${v.message}  (${v.ruleId})`);
    }
    lines.push('');
  }

  const total = report.errorCount + report.warningCount + report.infoCount;
  lines.push(
    `${total} problems (${report.errorCount} ERRORS, ${report.warningCount} WARNINGS, ${report.infoCount} INFO)`
  );

  return lines.join('\n') + '\n';
}
