const {
    defineConfig,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const jest = require("eslint-plugin-jest");
const react = require("eslint-plugin-react");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");

const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        parser: tsParser,

        globals: {
            ...globals.browser,
            ...globals.node,
            ...jest.environments.globals.globals,
            ...globals.jest,
            ga: "readonly",
        },

        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
    },

    plugins: {
        jest,
        react,
        "@typescript-eslint": typescriptEslint,
    },

    extends: compat.extends(
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
    ),

    rules: {
        "linebreak-style": ["error", "unix"],
        semi: ["error", "always"],
        "object-curly-spacing": ["error", "always"],
        "react/react-in-jsx-scope": "off",
        "react/display-name": "off",
        "react/no-unescaped-entities": "off",
        "no-undef": "off",
    },

    settings: {
        react: {
            version: "detect",
        },
    },
}]);
