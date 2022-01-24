#!/usr/bin/env node
/* istanbul ignore file */

import * as yargs from 'yargs'
import { resolve } from 'app-root-path'
import { installMiddleware, removeMiddleware } from './prepare-middleware'

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
      try {
        installMiddleware(argv.middlewarePath)
      } catch (e) {
        if (e instanceof Error) console.error(e.message)
        process.exit(1)
      }
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
      try {
        removeMiddleware(argv.middlewarePath)
      } catch (e) {
        if (e instanceof Error) console.error(e.message)
        process.exit(1)
      }
    }
  )
  .help().argv
