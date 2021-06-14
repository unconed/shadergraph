const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

const libraryName = 'ShaderGraph';
const PATHS = {
  entryPoint: path.resolve(__dirname, 'src/index.js'),
  bundles: path.resolve(__dirname, 'dist'),
};

const config = {
  entry: {
    'shadergraph': [PATHS.entryPoint],
    'shadergraph.min': [PATHS.entryPoint]
  },

  // The output defines how and where we want the bundles. The special value
  // `[name]` in `filename` tell Webpack to use the name we defined above. We
  // target a UMD and name it MyLib. When including the bundle in the browser it
  // will be accessible at `window.MyLib`
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    libraryTarget: 'umd',
    library: libraryName,
    umdNamedDefine: true
  },
  resolve: {
    extensions: [
      // '.ts',
      '.js'
    ]
  },
  // Activate source maps for the bundles in order to preserve the original
  // source when the user debugs the application
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.min\.js$/
      })
    ],
  },
};

module.exports = config;
