module.exports = {
  mode: "development",
  entry: {
    background: "./src/background.ts",
    downloadhelper: "./src/downloadhelper.ts",
    page: "./src/page.ts"
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist/js"
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader" }]
  },
  resolve: {
    extensions: [".ts", ".js"]
  }
};
