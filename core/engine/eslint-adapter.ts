import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/types';
import type { CommentLike, GasHealerRule, RuleContext } from '../../types/rule';
import { filterInlineIgnored } from './ignore';

function toRuleType(severity: GasHealerRule['severity']): 'problem' | 'suggestion' {
  return severity === 'ERROR' ? 'problem' : 'suggestion';
}

/**
 * GasHealerRule（純粋なcheck関数）を、ESLint Flat Configにそのまま組み込めるRuleModuleへ変換する。
 * ASTの走査自体はESLint本体に委譲し、各nodeでrule.check()を呼び出すだけの薄いアダプタとする。
 */
export function toESLintRule(rule: GasHealerRule): Rule.RuleModule {
  return {
    meta: {
      type: toRuleType(rule.severity),
      docs: {
        description: rule.description,
      },
      schema: [],
    },
    create(context: Rule.RuleContext): Rule.RuleListener {
      const ancestors: TSESTree.Node[] = [];

      return {
        '*': (node: unknown) => {
          const comments = context.sourceCode.getAllComments() as unknown as CommentLike[];
          const ruleContext: RuleContext = {
            filePath: context.filename,
            comments,
            sourceText: context.sourceCode.getText(),
            ancestors: [...ancestors],
            program: context.sourceCode.ast as unknown as TSESTree.Program,
          };

          const violations = filterInlineIgnored(
            rule.check(node as TSESTree.Node, ruleContext),
            comments
          );

          for (const violation of violations) {
            context.report({
              message: violation.message,
              loc: { line: violation.line, column: Math.max(violation.column - 1, 0) },
            });
          }

          ancestors.push(node as TSESTree.Node);
        },
        '*:exit': () => {
          ancestors.pop();
        },
      };
    },
  };
}

/**
 * gas-healerの全ルールを ESLint Flat Config の plugins.rules として組み込める形にまとめる。
 * eslint.config.js からは以下のように利用する：
 *   import gasHealer from 'gas-healer';
 *   export default [{ plugins: { 'gas-healer': gasHealer }, rules: { 'gas-healer/no-global-service': 'error', ... } }];
 */
export function buildESLintPlugin(rules: GasHealerRule[]): { rules: Record<string, Rule.RuleModule> } {
  const entries = rules.map((rule) => [rule.id, toESLintRule(rule)] as const);
  return { rules: Object.fromEntries(entries) };
}
