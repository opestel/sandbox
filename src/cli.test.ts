import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function runCli(args: string[]): string {
  return execFileSync('npx', ['tsx', 'src/cli.ts', ...args], {
    encoding: 'utf8',
  }).trim();
}

describe('cli', () => {
  it('greets the given name', () => {
    expect(runCli(['Ada'])).toBe('Hello, Ada!');
  });

  it('defaults to World when no name is given', () => {
    expect(runCli([])).toBe('Hello, World!');
  });
});
