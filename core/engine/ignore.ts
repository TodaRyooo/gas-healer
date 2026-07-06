import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CommentLike, Violation } from '../../types/rule';

const IGNORE_FILE_NAME = 'gas-healer-ignore.json';
const INLINE_IGNORE_MARKER = 'gas-healer-ignore';

export interface IgnoreEntry {
  file: string;
  ruleId: string;
}

export interface IgnoreConfig {
  ignores: IgnoreEntry[];
}

const EMPTY_CONFIG: IgnoreConfig = { ignores: [] };

/**
 * プロジェクトルートの gas-healer-ignore.json を読み込む。
 * 存在しない場合は空のignore設定を返す。
 */
export function loadIgnoreConfig(rootDir: string): IgnoreConfig {
  const configPath = path.join(rootDir, IGNORE_FILE_NAME);
  if (!fs.existsSync(configPath)) {
    return EMPTY_CONFIG;
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<IgnoreConfig>;
  return { ignores: parsed.ignores ?? [] };
}

function normalizePath(p: string): string {
  return p.split(path.sep).join('/').replace(/^\.\//, '');
}

/** gas-healer-ignore.json の設定に基づき、指定ファイル・ルールIDが除外対象かどうかを判定する */
export function isIgnoredByConfig(
  config: IgnoreConfig,
  rootDir: string,
  absoluteFilePath: string,
  ruleId: string
): boolean {
  const relativePath = normalizePath(path.relative(rootDir, absoluteFilePath));
  return config.ignores.some(
    (entry) =>
      (entry.ruleId === ruleId || entry.ruleId === '*') &&
      normalizePath(entry.file) === relativePath
  );
}

function isInlineIgnoreComment(comment: CommentLike): boolean {
  return comment.type === 'Block' && comment.value.trim() === INLINE_IGNORE_MARKER;
}

/**
 * 対象行の直前行に /* gas-healer-ignore *\/ コメントがある場合、その違反を除外する。
 */
export function filterInlineIgnored(violations: Violation[], comments: CommentLike[]): Violation[] {
  const ignoredLines = new Set(
    comments.filter(isInlineIgnoreComment).map((c) => c.loc.end.line + 1)
  );
  return violations.filter((v) => !ignoredLines.has(v.line));
}
