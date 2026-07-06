import type { TSESTree } from '@typescript-eslint/types';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { GasHealerRule, RuleContext, Violation } from '../types/rule';
import { isInGlobalScope, traverse } from '../core/engine/traverse';
import { GAS_RESERVED_TRIGGER_NAMES } from './gas-constants';

/**
 * `ScriptApp.newTrigger('functionName')` の 'functionName' を全て収集する。
 * トリガーは動的な文字列で指定されるため、ファイル全体を都度スキャンする必要がある。
 */
function collectDynamicTriggerNames(program: TSESTree.Program): Set<string> {
  const names = new Set<string>();

  traverse(program, (node) => {
    if (
      node.type === AST_NODE_TYPES.CallExpression &&
      node.callee.type === AST_NODE_TYPES.MemberExpression &&
      node.callee.object.type === AST_NODE_TYPES.Identifier &&
      node.callee.object.name === 'ScriptApp' &&
      node.callee.property.type === AST_NODE_TYPES.Identifier &&
      node.callee.property.name === 'newTrigger'
    ) {
      const firstArg = node.arguments[0];
      if (firstArg && firstArg.type === AST_NODE_TYPES.Literal && typeof firstArg.value === 'string') {
        names.add(firstArg.value);
      }
    }
  });

  return names;
}

export const noArrowTrigger: GasHealerRule = {
  id: 'no-arrow-trigger',
  name: 'no-arrow-trigger',
  description:
    'GASのトリガー関数（onEdit等の予約関数名、およびScriptApp.newTriggerで指定される関数名）を' +
    '非ホイストのconstアロー関数で定義するのを禁止する。GASのグローバルスコープではconstアロー関数は' +
    '非ホイストのため、実行順序によっては「関数が未定義」エラーを起こす。',
  severity: 'ERROR',

  check(node: TSESTree.Node, context: RuleContext): Violation[] {
    if (node.type !== AST_NODE_TYPES.VariableDeclarator) {
      return [];
    }
    if (node.id.type !== AST_NODE_TYPES.Identifier) {
      return [];
    }
    if (!node.init || node.init.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
      return [];
    }
    if (!isInGlobalScope(context.ancestors)) {
      return [];
    }

    const name = node.id.name;
    const isReserved = GAS_RESERVED_TRIGGER_NAMES.has(name);
    const isDynamicTrigger = collectDynamicTriggerNames(context.program).has(name);

    if (!isReserved && !isDynamicTrigger) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: this.severity,
        message: `トリガー関数 "${name}" がconstアロー関数で定義されています。非ホイストのため function宣言に変更してください。`,
        line: node.loc.start.line,
        column: node.loc.start.column + 1,
      },
    ];
  },
};
