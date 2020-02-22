// rollup.config.js
export default {
    input: './dist/webglplot.js',
    output: {
      file: './dist/bundle.js',
      name: 'webglplotBundle',
      format: 'iife'
    }
  };