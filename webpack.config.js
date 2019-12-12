module.exports = {
    entry: './src/index.js',
    output: {
      filename: './eurostat.js',
      publicPath: "dist",
      //filename: './dist/eurostat.js'
      library: 'EstLib'
    },
    watch: true  
  };
