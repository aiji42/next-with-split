const { build } = require('esbuild')
const { dependencies, peerDependencies } = require('./package.json')

const omitModulePlugin = (filter, modName) => ({
  name: 'omit',
  setup(build) {
    build.onResolve({ filter }, (args) => ({
      path: args.path,
      namespace: 'omitted'
    }))

    build.onLoad({ filter: /.*/, namespace: 'omitted' }, (args) => ({
      contents: `export const ${modName} = () => {
        throw new Error('Not defined ${modName}.')
      }`,
      loader: 'js'
    }))
  }
})

const shared = {
  entryPoints: ['./src/index.ts'],
  external: Object.keys({ ...dependencies, ...peerDependencies }),
  bundle: true,
  outdir: './build',
  target: 'esnext'
}

build({
  ...shared,
  plugins: [omitModulePlugin(/middleware$/, 'middleware')],
  outExtension: { '.js': '.cjs' },
  format: 'cjs'
})

build({
  ...shared,
  plugins: [omitModulePlugin(/with-split$/, 'withSplit')],
  outExtension: { '.js': '.mjs' },
  format: 'esm'
})
