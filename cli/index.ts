import * as path from 'node:path';
import { ESLint, type Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { parseArgs } from './args';
import { allRules } from '../rules';
import { buildESLintPlugin } from '../core/engine/eslint-adapter';
import { loadIgnoreConfig, isIgnoredByConfig } from '../core/engine/ignore';
import { buildReport, hasErrors, type Report } from '../core/reporter/reporter';
import { formatStylish } from '../formatter/stylish';
import { formatJson } from '../formatter/json';
import type { Severity, Violation } from '../types/rule';

const severityByRuleId = new Map<string, Severity>(allRules.map((rule) => [rule.id, rule.severity]));

function toLinterSeverity(severity: Severity): Linter.StringSeverity {
  return severity === 'ERROR' ? 'error' : 'warn';
}

export interface CliResult {
  exitCode: number;
  output: string;
}

/**
 * gas-healer check <dir> [--format=json] を実行する。
 * ルール適用はESLintクラスAPI（Flat Config相当）に委譲し、CLIはその結果を
 * gas-healer独自のignore機構でフィルタしてフォーマットするだけの薄いラッパー。
 */
export async function runCli(argv: string[]): Promise<CliResult> {
  const args = parseArgs(argv);
  const rootDir = process.cwd();
  const targetDir = path.resolve(rootDir, args.targetDir);

  const ignoreConfig = loadIgnoreConfig(rootDir);
  const gasHealerPlugin = buildESLintPlugin(allRules);

  const rulesConfig: Record<string, Linter.StringSeverity> = {};
  for (const rule of allRules) {
    rulesConfig[`gas-healer/${rule.id}`] = toLinterSeverity(rule.severity);
  }

  const eslint = new ESLint({
    cwd: rootDir,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
        },
        plugins: { 'gas-healer': gasHealerPlugin },
        rules: rulesConfig,
      },
    ],
  });

  const results = await eslint.lintFiles([path.join(targetDir, '**/*.ts').split(path.sep).join('/')]);

  const fileViolations = new Map<string, Violation[]>();

  for (const result of results) {
    const violations: Violation[] = [];

    for (const message of result.messages) {
      if (!message.ruleId) {
        // パースエラー等、gas-healerルール以外に起因するメッセージ
        violations.push({
          ruleId: 'parse-error',
          severity: 'ERROR',
          message: message.message,
          line: message.line,
          column: message.column,
        });
        continue;
      }

      const ruleId = message.ruleId.replace(/^gas-healer\//, '');
      const severity = severityByRuleId.get(ruleId) ?? 'WARNING';

      if (isIgnoredByConfig(ignoreConfig, rootDir, result.filePath, ruleId)) {
        continue;
      }

      violations.push({
        ruleId,
        severity,
        message: message.message,
        line: message.line,
        column: message.column,
      });
    }

    fileViolations.set(result.filePath, violations);
  }

  const report: Report = buildReport(fileViolations);
  const output = args.format === 'json' ? formatJson(report) : formatStylish(report, rootDir);

  return { exitCode: hasErrors(report) ? 1 : 0, output };
}
