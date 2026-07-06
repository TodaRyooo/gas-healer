export type OutputFormat = 'stylish' | 'json';

export interface CliArgs {
  command: string;
  targetDir: string;
  format: OutputFormat;
}

const SUPPORTED_FORMATS = new Set<OutputFormat>(['stylish', 'json']);

/**
 * `gas-healer check <dir> [--format=json]` をパースする。
 * MVPでは `check` サブコマンドのみ対応。
 */
export function parseArgs(argv: string[]): CliArgs {
  const [command, targetDir, ...rest] = argv;

  if (command !== 'check') {
    throw new Error(`未対応のコマンドです: "${command ?? ''}"。 使用例: gas-healer check <対象ディレクトリ>`);
  }
  if (!targetDir) {
    throw new Error('対象ディレクトリを指定してください。使用例: gas-healer check ./src');
  }

  let format: OutputFormat = 'stylish';
  for (const arg of rest) {
    const match = /^--format=(.+)$/.exec(arg);
    if (match) {
      const value = match[1];
      if (value !== 'stylish' && value !== 'json') {
        throw new Error(`未対応の --format です: "${value}"。 使用可能な値: stylish, json`);
      }
      format = value;
    }
  }

  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error(`未対応の --format です: "${format}"`);
  }

  return { command, targetDir, format };
}
