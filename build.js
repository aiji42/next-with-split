const { build } = require('esbuild')

build({
  entryPoints: ['./src/index.ts', './src/main.ts'],
  bundle: true,
  outdir: './build',
  outExtension: { '.js': '.cjs' },
  format: 'cjs',
  target: 'esnext'
})

build({
  entryPoints: ['./src/index.ts', './src/main.ts'],
  bundle: true,
  outdir: './build',
  outExtension: { '.js': '.mjs' },
  format: 'esm',
  target: 'esnext'
})
