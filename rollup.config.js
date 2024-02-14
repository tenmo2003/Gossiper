import inject from '@rollup/plugin-inject';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [
    inject({
      Promise: ['es6-promise', 'Promise']
    })
  ]
};