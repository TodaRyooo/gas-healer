import type { GasHealerRule } from '../types/rule';
import { noGlobalService } from './no-global-service';
import { noArrowTrigger } from './no-arrow-trigger';
import { noSetvalueLoop } from './no-setvalue-loop';
import { noGlobalState } from './no-global-state';

export { noGlobalService } from './no-global-service';
export { noArrowTrigger } from './no-arrow-trigger';
export { noSetvalueLoop } from './no-setvalue-loop';
export { noGlobalState } from './no-global-state';

/**
 * gas-healer MVPの全ルール。
 * ルール5「未使用のグローバル関数検出」は動的トリガーの静的解析限界のため未実装（README Roadmap参照）。
 */
export const allRules: GasHealerRule[] = [noGlobalService, noArrowTrigger, noSetvalueLoop, noGlobalState];
