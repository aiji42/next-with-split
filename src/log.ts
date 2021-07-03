import chalk from 'chalk'

const prefixes = {
  error: chalk.red('error') + ' -',
  warn: chalk.yellow('warn') + '  -',
  info: chalk.cyan('info') + '  -'
}

export function error(...message: string[]): void {
  console.error(prefixes.error, ...message)
}

export function info(...message: string[]): void {
  console.log(prefixes.info, ...message)
}
