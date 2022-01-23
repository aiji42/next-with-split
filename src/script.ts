#!/usr/bin/env node

import { statSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as yargs from 'yargs'

const installMiddleware = (middlewarePath: string) => {
  console.log('split traffic enabled, installing middleware: ', middlewarePath)
  // TODO: Prohibit overwriting
  writeFileSync(resolve(__dirname, '../../..', middlewarePath), scriptText)
}

const removeMiddleware = (middlewarePath: string) => {
  console.log('split traffic disabled, removing middleware: ', middlewarePath)
  const path = resolve(__dirname, '../../..', middlewarePath)
  if (
    statSync(path, {
      throwIfNoEntry: false
    })
  ) {
    unlinkSync(path)
  }
}

// TODO: add README link
const scriptText = `// This file was installed automatically by the with-next-split command.
// Note: Do not update this file manually.
export { middleware } from 'next-with-split'
`

yargs
  .scriptName('next-with-split')
  // TODO: Flag to force overwriting
  .command<{ middlewarePath: string }>(
    'install <middlewarePath>',
    'split traffic enabled, installing middleware',
    (yargs) => {
      yargs.positional('middlewarePath', {
        type: 'string',
        describe: 'middleware fire path (e.g. pages/_middleware.js)'
      })
    },
    (argv) => {
      installMiddleware(argv.middlewarePath)
    }
  )
  .command<{ middlewarePath: string }>(
    'remove <middlewarePath>',
    'split traffic disabled, removing middleware',
    (yargs) => {
      yargs.positional('middlewarePath', {
        type: 'string',
        describe: 'middleware fire path (e.g. pages/_middleware.js)'
      })
    },
    (argv) => {
      removeMiddleware(argv.middlewarePath)
    }
  )
  .help().argv
