import type { TSESTree } from '@typescript-eslint/types';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { GasHealerRule, RuleContext, Violation } from '../types/rule';

export const noGlobalState: GasHealerRule = {
  id: 'no-global-state',
  name: 'no-global-state',
  description:
    'グローバルスコープでlet/varにより可変な変数を宣言するのを禁止する。' +
    'GASではスクリプトインスタンスがトリガー実行間で再利用されることがあり、' +
    'グローバルな可変状態はトリガー間の状態汚染・予期しないバグの原因になる。',
  severity: 'WARNING',

  check(node: TSESTree.Node, context: RuleContext): Violation[] {
    if (node.type !== AST_NODE_TYPES.VariableDeclaration) {
      return [];
    }
    if (node.kind !== 'let' && node.kind !== 'var') {
      return [];
    }

    const parent = context.ancestors[context.ancestors.length - 1];
    const isTopLevel = parent?.type === AST_NODE_TYPES.Program;
    if (!isTopLevel) {
      return [];
    }

    return node.declarations.map((declarator) => ({
      ruleId: this.id,
      severity: this.severity,
      message: `グローバルスコープで${node.kind}による可変状態を宣言しています。CacheService等への外出しを検討してください。`,
      line: declarator.loc.start.line,
      column: declarator.loc.start.column + 1,
    }));
  },
};
