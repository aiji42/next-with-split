#!/usr/bin/env node

import {
  statSync,
  unlinkSync,
  writeFileSync,
  existsSync,
  readFileSync
} from 'node:fs'
import * as yargs from 'yargs'
import { resolve } from 'app-root-path'

const installMiddleware = (middlewarePath: string) => {
  validateMiddlewarePath(middlewarePath)
  const path = resolve(middlewarePath)
  if (
    existsSync(path) &&
    !/export.+middleware.+from.+next-with-split/.test(
      readFileSync(path).toString()
    )
  ) {
    throw new Error(`Manually created middleware is present: ${middlewarePath}`)
  }
  console.log('split traffic enabled, installing middleware: ', middlewarePath)
  writeFileSync(path, scriptText)
}

const removeMiddleware = (middlewarePath: string) => {
  validateMiddlewarePath(middlewarePath)
  const path = resolve(middlewarePath)
  if (
    statSync(path, {
      throwIfNoEntry: false
    })
  ) {
    console.log('split traffic disabled, removing middleware: ', middlewarePath)
    unlinkSync(path)
  }
}

const validateMiddlewarePath = (path: string) => {
  if (!/pages\/.*_middleware\.(js|ts)$/.test(path))
    throw new Error(`Invalid middleware path: ${path}`)
}

// TODO: add README link
const scriptText = `// This file was installed automatically by the with-next-split command.
// Note: Do not update this file manually.
export { middleware } from 'next-with-split'
`

yargs
  .scriptName('next-with-split')
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
