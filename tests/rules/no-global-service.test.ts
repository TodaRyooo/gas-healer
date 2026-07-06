import { describe, expect, it } from 'bun:test';
import { noGlobalService } from '../../rules/no-global-service';
import { runSingleRule } from '../helpers';

describe('no-global-service', () => {
  it('グローバルスコープでのService取得を検出する', () => {
    const code = `
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      function main() {
        ss.getSheetByName('Sheet1');
      }
    `;
    const violations = runSingleRule(noGlobalService, code);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe('no-global-service');
    expect(violations[0]?.severity).toBe('ERROR');
  });

  it('関数内でのService取得は検出しない', () => {
    const code = `
      function main() {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        ss.getSheetByName('Sheet1');
      }
    `;
    expect(runSingleRule(noGlobalService, code)).toHaveLength(0);
  });

  it('未知のグローバルオブジェクトへの呼び出しは検出しない', () => {
    const code = `
      const result = SomeOtherLib.doSomething();
    `;
    expect(runSingleRule(noGlobalService, code)).toHaveLength(0);
  });

  it('グローバルスコープでの複数Service取得をそれぞれ検出する', () => {
    const code = `
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const props = PropertiesService.getScriptProperties();
    `;
    expect(runSingleRule(noGlobalService, code)).toHaveLength(2);
  });
});
