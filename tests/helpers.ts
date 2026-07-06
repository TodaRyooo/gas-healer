import { runRules } from '../core/engine/engine';
import type { GasHealerRule, Violation } from '../types/rule';

export function runSingleRule(rule: GasHealerRule, code: string, filePath = '/virtual/test.ts'): Violation[] {
  return runRules(code, filePath, [rule]);
}
