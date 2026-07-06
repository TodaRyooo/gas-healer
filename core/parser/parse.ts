import { parseForESLint } from '@typescript-eslint/parser';
import type { TSESTree } from '@typescript-eslint/types';
import type { CommentLike } from '../../types/rule';

export interface ParseResult {
  program: TSESTree.Program;
  comments: CommentLike[];
}

/**
 * @typescript-eslint/parser をラップし、gas-healer内部で扱いやすい形のASTとコメント一覧を返す。
 */
export function parseSource(sourceText: string, filePath: string): ParseResult {
  const { ast } = parseForESLint(sourceText, {
    range: true,
    loc: true,
    comment: true,
    filePath,
  });

  const comments: CommentLike[] = (ast.comments ?? []).map((c) => ({
    type: c.type as 'Line' | 'Block',
    value: c.value,
    loc: c.loc,
  }));

  return { program: ast, comments };
}
