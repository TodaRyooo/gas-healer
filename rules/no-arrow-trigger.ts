import type { TSESTree } from '@typescript-eslint/types';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { GasHealerRule, RuleContext, Violation } from '../types/rule';
import { isInGlobalScope } from '../core/engine/traverse';
import { GAS_RESERVED_TRIGGER_NAMES } from './gas-constants';

export const noArrowTrigger: GasHealerRule = {
  id: 'no-arrow-trigger',
  name: 'no-arrow-trigger',
  description:
    'GASの予約済みシンプルトリガー関数名（onEdit, onOpen等）を非ホイストのconstアロー関数で' +
    '定義するのを禁止する。GASはこれらの名前を持つグローバル関数を自動的に呼び出すため、' +
    'バンドラー等によってグローバルスコープから見えなくなったり、非ホイストゆえの実行順序次第で' +
    '「関数が未定義」エラーを起こす。' +
    'ScriptApp.newTriggerで登録するカスタム名のハンドラは対象外（README Limitations参照）。',
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
    if (!GAS_RESERVED_TRIGGER_NAMES.has(node.id.name)) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: this.severity,
        message: `トリガー関数 "${node.id.name}" がconstアロー関数で定義されています。非ホイストのため function宣言に変更してください。`,
        line: node.loc.start.line,
        column: node.loc.start.column + 1,
      },
    ];
  },
};
