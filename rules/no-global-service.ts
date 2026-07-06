import type { TSESTree } from '@typescript-eslint/types';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { GasHealerRule, RuleContext, Violation } from '../types/rule';
import { isInGlobalScope } from '../core/engine/traverse';
import { GAS_SERVICE_GLOBALS } from './gas-constants';

export const noGlobalService: GasHealerRule = {
  id: 'no-global-service',
  name: 'no-global-service',
  description:
    '関数の外（グローバルスコープ）でGAS Service取得API（SpreadsheetApp.getActiveSpreadsheet()等）を呼び出すのを禁止する。' +
    'グローバルスコープでのService取得はスクリプト読み込み時に評価され、トリガー実行時の状態不整合や初期化コスト増加の原因になる。',
  severity: 'ERROR',

  check(node: TSESTree.Node, context: RuleContext): Violation[] {
    if (node.type !== AST_NODE_TYPES.CallExpression) {
      return [];
    }

    const callee = node.callee;
    if (
      callee.type !== AST_NODE_TYPES.MemberExpression ||
      callee.object.type !== AST_NODE_TYPES.Identifier ||
      !GAS_SERVICE_GLOBALS.has(callee.object.name)
    ) {
      return [];
    }

    if (!isInGlobalScope(context.ancestors)) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: this.severity,
        message: `グローバルスコープで ${callee.object.name} のService APIを呼び出しています。関数内で取得してください。`,
        line: node.loc.start.line,
        column: node.loc.start.column + 1,
      },
    ];
  },
};
