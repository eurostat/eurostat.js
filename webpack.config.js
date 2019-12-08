module.exports = {
    mode: 'development',
    entry: './index.js', // entry: ["./lib.js", "./index.js"],
    output: {
      filename: 'main.js',
      publicPath: 'dist',
      library: 'EstLib'
    }
  };
