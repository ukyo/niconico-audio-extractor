module.exports = {
  mode: "development",
  entry: {
    background: "./src/background.ts",
    page: "./src/page.ts",
    extractmovie: "./src/extractmovie.ts",
    extractaudio: "./src/extractaudio.ts"
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
