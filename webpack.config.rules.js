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
  // loaders are evaluated from bottom to top (right to left)
  // so first transpile via babel, then expose as global
  {
    test: require.resolve(__dirname + "/static/js/src/base/base.js"),
    use: ["expose-loader?exposes=charmhub.base", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/src/public/details/index.ts"),
    use: ["expose-loader?exposes=charmhub.details", "babel-loader"],
  },
  {
    test: require.resolve(
      __dirname + "/static/js/src/public/details/overview/index.js"
    ),
    use: ["expose-loader?exposes=charmhub.details.overview", "babel-loader"],
  },
  {
    test: /\.tsx?/,
    use: ["ts-loader"],
  },
];
