#!/usr/bin/env node
import { Command } from 'commander';
import { greet } from './index.js';

const program = new Command();

program
  .name('sandbox')
  .description('CLI for the sandbox project')
  .argument('[name]', 'name to greet', 'World')
  .action((name: string) => {
    console.log(greet(name));
  });

program.parse();
