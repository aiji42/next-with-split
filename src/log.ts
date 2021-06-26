import chalk from 'chalk'

const prefixes = {
  error: chalk.red('error') + ' -',
  warn: chalk.yellow('warn') + '  -',
  info: chalk.cyan('info') + '  -'
}

export function error(...message: string[]) {
  console.error(prefixes.error, ...message)
}

export function warn(...message: string[]) {
  console.warn(prefixes.warn, ...message)
}

export function info(...message: string[]) {
  console.log(prefixes.info, ...message)
}
