import { describe, expect, it } from 'bun:test';
import { noArrowTrigger } from '../../rules/no-arrow-trigger';
import { runSingleRule } from '../helpers';

describe('no-arrow-trigger', () => {
  it('予約トリガー名のconstアロー関数を検出する', () => {
    const code = `
      const onEdit = (e: GoogleAppsScript.Events.SheetsOnEdit) => {
        console.log(e);
      };
    `;
    const violations = runSingleRule(noArrowTrigger, code);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe('no-arrow-trigger');
    expect(violations[0]?.severity).toBe('ERROR');
  });

  it('function宣言によるトリガー定義は検出しない', () => {
    const code = `
      function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
        console.log(e);
      }
    `;
    expect(runSingleRule(noArrowTrigger, code)).toHaveLength(0);
  });

  it('ScriptApp.newTriggerで指定される関数名のconstアロー関数を検出する', () => {
    const code = `
      const myCustomTrigger = () => {
        console.log('run');
      };
      function setup() {
        ScriptApp.newTrigger('myCustomTrigger').timeBased().everyHours(1).create();
      }
    `;
    const violations = runSingleRule(noArrowTrigger, code);
    expect(violations).toHaveLength(1);
  });

  it('トリガーと無関係なconstアロー関数は検出しない', () => {
    const code = `
      const helper = () => {
        return 1;
      };
    `;
    expect(runSingleRule(noArrowTrigger, code)).toHaveLength(0);
  });
});
