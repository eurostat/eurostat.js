const path = require('path');

module.exports = [{
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'eurostat.js',
    libraryTarget: 'commonjs2'
  }
},
{
  entry: './src/index.js',
  output: {
    filename: 'eurostat-min.js',
    publicPath: "dist",
    library: 'EstLib'
  }
  //watch: true
}
];
