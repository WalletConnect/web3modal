import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'
import litCss from 'rollup-plugin-lit-css'
import minifyHtml from 'rollup-plugin-minify-html-literals'

const nodeVersion = Number(process.versions.node.split('.')[0])
if (nodeVersion < 16) {
  throw new Error('Node version must be 16.x or higher')
}

export default function createConfig(packageJson) {
  const output = {
    exports: 'named',
    name: packageJson.name,
    sourcemap: true
  }

  const esbuildPlugin = esbuild({
    minify: true,
    tsconfig: './tsconfig.json',
    platform: 'browser',
    treeShaking: true,
    loaders: {
      '.json': 'json'
    }
  })

  const litCssPlugin = litCss({
    include: ['**/*.css'],
    uglify: true
  })

  const replacePlugin = replace({
    'process.env.ROLLUP_W3M_VERSION': JSON.stringify(packageJson.version)
  })

  return [
    {
      input: './index.ts',
      plugins: [replacePlugin, litCssPlugin, minifyHtml.default(), esbuildPlugin],
      output: [{ file: './dist/index.js', format: 'es', ...output }]
    }
  ]
}
