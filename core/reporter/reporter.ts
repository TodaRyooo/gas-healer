import type { Violation } from '../../types/rule';

export interface FileReport {
  filePath: string;
  violations: Violation[];
}

export interface Report {
  files: FileReport[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * ファイルパス毎のViolation一覧からReportを構築する。
 * 空配列(=違反なし)のファイルはfiles配列に含めない。
 */
export function buildReport(fileViolations: Map<string, Violation[]>): Report {
  const files: FileReport[] = [];
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const [filePath, violations] of fileViolations) {
    if (violations.length === 0) continue;

    files.push({ filePath, violations });
    for (const v of violations) {
      if (v.severity === 'ERROR') errorCount++;
      else if (v.severity === 'WARNING') warningCount++;
      else infoCount++;
    }
  }

  return { files, errorCount, warningCount, infoCount };
}

/** ERRORが1件でもあればtrue（CLIの終了コード判定に使用） */
export function hasErrors(report: Report): boolean {
  return report.errorCount > 0;
}
