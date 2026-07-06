import { allRules } from './rules';
import { buildESLintPlugin } from './core/engine/eslint-adapter';

/**
 * eslint-plugin-gas-healer 本体。
 * eslint.config.js から次のように利用する：
 *
 *   import gasHealer from 'gas-healer';
 *   export default [
 *     {
 *       files: ['**\/*.ts'],
 *       plugins: { 'gas-healer': gasHealer },
 *       rules: {
 *         'gas-healer/no-global-service': 'error',
 *         'gas-healer/no-arrow-trigger': 'error',
 *         'gas-healer/no-setvalue-loop': 'warn',
 *         'gas-healer/no-global-state': 'warn',
 *       },
 *     },
 *   ];
 */
const gasHealer = buildESLintPlugin(allRules);

export default gasHealer;
export { allRules } from './rules';
export type { GasHealerRule, Violation, Severity, RuleContext } from './types/rule';
