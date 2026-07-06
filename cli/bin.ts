#!/usr/bin/env node
import { runCli } from './index';

async function main(): Promise<void> {
  try {
    const { exitCode, output } = await runCli(process.argv.slice(2));
    process.stdout.write(output);
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

void main();
