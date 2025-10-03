export default [{
  input: ['./src/server.js', './src/utils.js', './src/callback.js'],
  external: id => /^(lib0|yjs|@y|ws|lodash\.debounce|http|y-leveldb)/.test(id),
  output: [{
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
    entryFileNames: '[name].cjs',
    chunkFileNames: '[name]-[hash].cjs'
  }]
}
]
