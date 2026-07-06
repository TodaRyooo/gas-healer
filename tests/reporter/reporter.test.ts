import { describe, expect, it } from 'bun:test';
import { buildReport, hasErrors } from '../../core/reporter/reporter';
import { formatJson } from '../../formatter/json';
import { formatStylish } from '../../formatter/stylish';
import type { Violation } from '../../types/rule';

const errorViolation: Violation = {
  ruleId: 'no-global-service',
  severity: 'ERROR',
  message: 'error message',
  line: 1,
  column: 1,
};

const warningViolation: Violation = {
  ruleId: 'no-global-state',
  severity: 'WARNING',
  message: 'warning message',
  line: 2,
  column: 3,
};

describe('buildReport', () => {
  it('severityごとに件数を集計する', () => {
    const map = new Map([['/project/a.ts', [errorViolation, warningViolation]]]);
    const report = buildReport(map);
    expect(report.errorCount).toBe(1);
    expect(report.warningCount).toBe(1);
    expect(report.infoCount).toBe(0);
    expect(report.files).toHaveLength(1);
  });

  it('違反が無いファイルはfilesに含めない', () => {
    const map = new Map([['/project/clean.ts', []]]);
    const report = buildReport(map);
    expect(report.files).toHaveLength(0);
  });

  it('hasErrorsはERRORが1件でもあればtrueを返す', () => {
    const withError = buildReport(new Map([['/project/a.ts', [errorViolation]]]));
    const withoutError = buildReport(new Map([['/project/a.ts', [warningViolation]]]));
    expect(hasErrors(withError)).toBe(true);
    expect(hasErrors(withoutError)).toBe(false);
  });
});

describe('formatter', () => {
  it('stylishはfilePathとseverity・ruleIdを含む文字列を出力する', () => {
    const report = buildReport(new Map([['/project/a.ts', [errorViolation]]]));
    const output = formatStylish(report, '/project');
    expect(output).toContain('a.ts');
    expect(output).toContain('no-global-service');
    expect(output).toContain('error');
  });

  it('jsonはパース可能な構造化出力を返す', () => {
    const report = buildReport(new Map([['/project/a.ts', [errorViolation]]]));
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed.errorCount).toBe(1);
    expect(parsed.files[0].violations[0].ruleId).toBe('no-global-service');
  });
});
