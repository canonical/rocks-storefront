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
        presets: ["@babel/preset-env", "@babel/preset-react"],
      },
    },
  },
  {
    test: /\.s[ac]ss$/i,
    use: [
      "style-loader",
      "css-loader",
      {
        loader: "sass-loader",
        // to be removed once vanilla-framework updates to dart sass 3.0.0
        options: {
          sassOptions: {
            quietDeps: true,
            silenceDeprecations: ["import", "global-builtin", "mixed-decls"],
          },
        },
      },
    ],
  },
  {
    test: /\.css$/i,
    use: ["style-loader", "css-loader"],
  },
  {
    // loaders run from right to left and bottom to top
    test: /\.tsx?/,
    use: ["ts-loader"],
  },
];
