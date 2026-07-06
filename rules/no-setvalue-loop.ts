import type { TSESTree } from '@typescript-eslint/types';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { GasHealerRule, RuleContext, Violation } from '../types/rule';

const LOOP_STATEMENT_TYPES = new Set<string>([
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.WhileStatement,
  AST_NODE_TYPES.DoWhileStatement,
]);

const ARRAY_ITERATION_METHODS = new Set<string>(['forEach', 'map']);

/** ループ文、または `xxx.forEach(callback)` / `xxx.map(callback)` のcallback内かどうかを判定する */
function isInsideLoop(ancestors: TSESTree.Node[]): boolean {
  for (let i = 0; i < ancestors.length; i++) {
    const current = ancestors[i];
    if (!current) continue;

    if (LOOP_STATEMENT_TYPES.has(current.type)) {
      return true;
    }

    const isCallback =
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression;
    if (!isCallback) continue;

    const parent = ancestors[i - 1];
    if (
      parent &&
      parent.type === AST_NODE_TYPES.CallExpression &&
      parent.callee.type === AST_NODE_TYPES.MemberExpression &&
      parent.callee.property.type === AST_NODE_TYPES.Identifier &&
      ARRAY_ITERATION_METHODS.has(parent.callee.property.name)
    ) {
      return true;
    }
  }
  return false;
}

export const noSetvalueLoop: GasHealerRule = {
  id: 'no-setvalue-loop',
  name: 'no-setvalue-loop',
  description:
    'for/forEach等のループ内でRange.setValue()を単発呼び出しするのを禁止する。' +
    'ループ内でセル単位のAPI呼び出しを繰り返すとGASの実行時間制限（6分）に抵触しやすく、' +
    'setValues()による一括書き込みが推奨される。',
  severity: 'WARNING',

  check(node: TSESTree.Node, context: RuleContext): Violation[] {
    if (node.type !== AST_NODE_TYPES.CallExpression) {
      return [];
    }
    if (
      node.callee.type !== AST_NODE_TYPES.MemberExpression ||
      node.callee.property.type !== AST_NODE_TYPES.Identifier ||
      node.callee.property.name !== 'setValue'
    ) {
      return [];
    }
    if (!isInsideLoop(context.ancestors)) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: this.severity,
        message: 'ループ内でsetValue()を単発呼び出ししています。setValues()による一括書き込みを検討してください。',
        line: node.loc.start.line,
        column: node.loc.start.column + 1,
      },
    ];
  },
};
