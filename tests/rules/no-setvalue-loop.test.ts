import { describe, expect, it } from 'bun:test';
import { noSetvalueLoop } from '../../rules/no-setvalue-loop';
import { runSingleRule } from '../helpers';

describe('no-setvalue-loop', () => {
  it('forループ内のsetValue単発呼び出しを検出する', () => {
    const code = `
      function main(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: string[]) {
        for (let i = 0; i < data.length; i++) {
          sheet.getRange(i + 1, 1).setValue(data[i]);
        }
      }
    `;
    const violations = runSingleRule(noSetvalueLoop, code);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe('no-setvalue-loop');
    expect(violations[0]?.severity).toBe('WARNING');
  });

  it('forEach内のsetValue単発呼び出しを検出する', () => {
    const code = `
      function main(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: string[]) {
        data.forEach((d, i) => {
          sheet.getRange(i + 1, 1).setValue(d);
        });
      }
    `;
    expect(runSingleRule(noSetvalueLoop, code)).toHaveLength(1);
  });

  it('setValuesによる一括書き込みは検出しない', () => {
    const code = `
      function main(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: string[]) {
        const values = data.map(d => [d]);
        sheet.getRange(1, 1, values.length, 1).setValues(values);
      }
    `;
    expect(runSingleRule(noSetvalueLoop, code)).toHaveLength(0);
  });

  it('ループ外のsetValue単発呼び出しは検出しない', () => {
    const code = `
      function main(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
        sheet.getRange(1, 1).setValue('hello');
      }
    `;
    expect(runSingleRule(noSetvalueLoop, code)).toHaveLength(0);
  });
});
