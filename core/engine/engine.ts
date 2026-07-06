import { parseSource } from '../parser/parse';
import { traverse } from './traverse';
import { filterInlineIgnored } from './ignore';
import type { GasHealerRule, RuleContext, Violation } from '../../types/rule';

/**
 * ソースコード1ファイル分に対して、渡された全ルールを適用しViolationを収集する。
 * インラインignore(`/* gas-healer-ignore *\/`)はここで最終フィルタされる。
 */
export function runRules(sourceText: string, filePath: string, rules: GasHealerRule[]): Violation[] {
  const { program, comments } = parseSource(sourceText, filePath);
  const violations: Violation[] = [];

  traverse(program, (node, ancestors) => {
    for (const rule of rules) {
      const context: RuleContext = {
        filePath,
        comments,
        sourceText,
        ancestors,
        program,
      };
      violations.push(...rule.check(node, context));
    }
  });

  return filterInlineIgnored(violations, comments);
}
