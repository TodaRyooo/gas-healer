import { visitorKeys as defaultVisitorKeys } from '@typescript-eslint/visitor-keys';
import type { TSESTree } from '@typescript-eslint/types';

type VisitorKeysMap = Record<string, readonly string[]>;

function isNode(value: unknown): value is TSESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value;
}

/**
 * @typescript-eslint/visitor-keys を用いた汎用AST走査。
 * visit()には現在のnodeと、root(Program)始点・直近の親を末尾とする祖先配列を渡す。
 */
export function traverse(
  node: TSESTree.Node,
  visit: (node: TSESTree.Node, ancestors: TSESTree.Node[]) => void,
  ancestors: TSESTree.Node[] = []
): void {
  visit(node, ancestors);

  const keys = (defaultVisitorKeys as VisitorKeysMap)[node.type] ?? [];
  const nextAncestors = [...ancestors, node];
  const record = node as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) {
          traverse(child, visit, nextAncestors);
        }
      }
    } else if (isNode(value)) {
      traverse(value, visit, nextAncestors);
    }
  }
}

const FUNCTION_LIKE_TYPES = new Set<string>([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

export function isFunctionLike(node: TSESTree.Node): boolean {
  return FUNCTION_LIKE_TYPES.has(node.type);
}

/** ancestors中にFunction境界が一つも無ければ「グローバルスコープ」とみなす */
export function isInGlobalScope(ancestors: TSESTree.Node[]): boolean {
  return !ancestors.some(isFunctionLike);
}
