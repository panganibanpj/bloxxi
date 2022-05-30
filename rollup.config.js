import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: './src/index.js',
  output: {
    file: './public/client.js',
    format: 'iife',
    globals: { Phaser: 'Phaser' },
  },
  plugins: [
    nodeResolve(),
    commonjs({ include: './node_modules/**' }),
  ],
  external: ['Phaser'],
};
