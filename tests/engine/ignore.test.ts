import { describe, expect, it } from 'bun:test';
import { runRules } from '../../core/engine/engine';
import { isIgnoredByConfig } from '../../core/engine/ignore';
import { noGlobalState } from '../../rules/no-global-state';

describe('インラインignoreコメント', () => {
  it('/* gas-healer-ignore */ が直前行にある場合その行の検出をスキップする', () => {
    const code = `
      /* gas-healer-ignore */
      let cachedData: string[] = [];
    `;
    const violations = runRules(code, '/virtual/test.ts', [noGlobalState]);
    expect(violations).toHaveLength(0);
  });

  it('ignoreコメントが無関係な行にある場合は検出される', () => {
    const code = `
      /* gas-healer-ignore */
      const unrelated = 1;
      let cachedData: string[] = [];
    `;
    const violations = runRules(code, '/virtual/test.ts', [noGlobalState]);
    expect(violations).toHaveLength(1);
  });
});

describe('gas-healer-ignore.json', () => {
  it('file + ruleIdが一致する場合は除外対象と判定する', () => {
    const config = { ignores: [{ file: 'src/foo.ts', ruleId: 'no-global-state' }] };
    expect(isIgnoredByConfig(config, '/project', '/project/src/foo.ts', 'no-global-state')).toBe(true);
  });

  it('ruleIdが異なる場合は除外対象にならない', () => {
    const config = { ignores: [{ file: 'src/foo.ts', ruleId: 'no-global-state' }] };
    expect(isIgnoredByConfig(config, '/project', '/project/src/foo.ts', 'no-arrow-trigger')).toBe(false);
  });

  it('ruleIdが "*" の場合は全ルールが除外対象になる', () => {
    const config = { ignores: [{ file: 'src/foo.ts', ruleId: '*' }] };
    expect(isIgnoredByConfig(config, '/project', '/project/src/foo.ts', 'no-arrow-trigger')).toBe(true);
  });

  it('ファイルパスが異なる場合は除外対象にならない', () => {
    const config = { ignores: [{ file: 'src/foo.ts', ruleId: '*' }] };
    expect(isIgnoredByConfig(config, '/project', '/project/src/bar.ts', 'no-arrow-trigger')).toBe(false);
  });
});
