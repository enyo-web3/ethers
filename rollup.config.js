import typescript from '@rollup/plugin-typescript';
import externals from 'rollup-plugin-node-externals';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [typescript(), externals()],
};
