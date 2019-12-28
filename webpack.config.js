module.exports = [{
    entry: './src/index.js',
    output: {
      filename: './eurostat-min.js',
      publicPath: "dist",
      library: 'EstLib'
    },
    //watch: true
  },
  {
    entry: './src/eurostat-base.js',
    output: {
      filename: './eurostat-base.js',
      publicPath: "dist"
    },
  },
  {
    entry: './src/eurostat-tooltip.js',
    output: {
      filename: './eurostat-tooltip.js',
      publicPath: "dist"
    },
  },
  {
    entry: './src/eurostat-map.js',
    output: {
      filename: './eurostat-map.js',
      publicPath: "dist"
    },
  },
  {
    entry: './src/eurostat-map.js',
    output: {
      filename: './eurostat-map-min.js',
      publicPath: "dist",
      library: 'EstLib'
    },
  }
];
