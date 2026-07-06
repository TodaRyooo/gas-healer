import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCli } from '../../cli/index';

describe('runCli', () => {
  it('対象ディレクトリに.ts/.jsファイルが無い場合、フレンドリーなメッセージとexitCode 0を返す', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-healer-empty-'));
    try {
      const result = await runCli(['check', emptyDir]);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('見つかりませんでした');
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('.jsファイルも.tsと同様に検査対象になる', async () => {
    const result = await runCli(['check', './sample']);
    expect(result.output).toContain('js-support-demo.js');
    expect(result.output).toContain('no-global-state');
  });

  it('.tsファイルが1件も無く.jsファイルのみのディレクトリでも検出できる(回帰防止)', async () => {
    const jsOnlyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-healer-js-only-'));
    try {
      fs.writeFileSync(path.join(jsOnlyDir, 'const.js'), 'let cachedData = [];\n');
      const result = await runCli(['check', jsOnlyDir]);
      expect(result.output).toContain('no-global-state');
      expect(result.output).not.toContain('見つかりませんでした');
    } finally {
      fs.rmSync(jsOnlyDir, { recursive: true, force: true });
    }
  });

  it('--format=jsonでも.jsファイルの違反が構造化出力に含まれる', async () => {
    const result = await runCli(['check', './sample', '--format=json']);
    const parsed = JSON.parse(result.output);
    const jsFile = parsed.files.find((f: { filePath: string }) => f.filePath.endsWith('js-support-demo.js'));
    expect(jsFile).toBeDefined();
    expect(jsFile.violations[0].ruleId).toBe('no-global-state');
  });
});
