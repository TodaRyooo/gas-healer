import type { TSESTree } from '@typescript-eslint/types';

export type Severity = 'ERROR' | 'WARNING' | 'INFO';

export interface Violation {
  ruleId: string;
  severity: Severity;
  message: string;
  line: number;
  column: number;
}

/**
 * @typescript-eslint/parser の comment ノードの最小構造。
 * ESLintのSourceCode由来・独自parser由来の両方を吸収するため独立して定義する。
 */
export interface CommentLike {
  type: 'Line' | 'Block';
  value: string;
  loc: TSESTree.SourceLocation;
}

export interface RuleContext {
  /** 検査対象ファイルの絶対パス */
  filePath: string;
  /** ファイル全体のコメント一覧（インラインignore判定に使用） */
  comments: CommentLike[];
  /** ファイル全体のソースコード */
  sourceText: string;
  /** 現在のnodeの祖先ノード（root=Program始点、直近の親が末尾） */
  ancestors: TSESTree.Node[];
  /** ファイル全体のProgram AST（ルール内で追加探索が必要な場合に使用） */
  program: TSESTree.Program;
}

export interface GasHealerRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  check(node: TSESTree.Node, context: RuleContext): Violation[];
}
