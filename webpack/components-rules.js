/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

module.exports = [
  {
    test: /\.js$/,
    // Exclude node_modules from using babel-loader
    // except some that use ES6 modules and need to be transpiled:
    // such as swiper http://idangero.us/swiper/get-started/
    // and also react-dnd related
    exclude: /node_modules\/(?!(dom7|ssr-window)\/).*/,
    use: {
      loader: "babel-loader",
      options: {
        presets: ["@babel/preset-react"],
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        configFile: path.resolve(__dirname, "webcomponents-babel.config.json"),
      },
    },
  },
];
