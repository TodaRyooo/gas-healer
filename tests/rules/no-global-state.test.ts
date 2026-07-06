import { describe, expect, it } from 'bun:test';
import { noGlobalState } from '../../rules/no-global-state';
import { runSingleRule } from '../helpers';

describe('no-global-state', () => {
  it('グローバルスコープのlet宣言を検出する', () => {
    const code = `
      let cachedData: string[] = [];
    `;
    const violations = runSingleRule(noGlobalState, code);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe('no-global-state');
    expect(violations[0]?.severity).toBe('WARNING');
  });

  it('グローバルスコープのvar宣言を検出する', () => {
    const code = `
      var cachedData = [];
    `;
    expect(runSingleRule(noGlobalState, code)).toHaveLength(1);
  });

  it('グローバルスコープのconst宣言は検出しない', () => {
    const code = `
      const CACHE_KEY = 'cachedData';
    `;
    expect(runSingleRule(noGlobalState, code)).toHaveLength(0);
  });

  it('関数内のlet宣言は検出しない', () => {
    const code = `
      function main() {
        let counter = 0;
        counter += 1;
      }
    `;
    expect(runSingleRule(noGlobalState, code)).toHaveLength(0);
  });

  it('1つのlet文で複数変数を宣言した場合はそれぞれ検出する', () => {
    const code = `
      let a = 1, b = 2;
    `;
    expect(runSingleRule(noGlobalState, code)).toHaveLength(2);
  });
});
