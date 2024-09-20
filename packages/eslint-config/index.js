/** @type {import('eslint').Linter.BaseConfig} **/
module.exports = {
  extends: [
    "airbnb-typescript",
    "plugin:import/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "import"],
  env: {
    browser: true,
    es6: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: ["./tsconfig.esm.json"],
  },
  ignorePatterns: ["**/dist/**/*"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        name: "bn.js",
        message: "We no longer use BN.js for big number calculations. Switch to using bignumber.js instead. Run pnpm run convert-bn to automatically switch BN to BigNumber in all folders"
      }
    ],
    "prettier/prettier": [
      "error",
      {
        parser: "typescript",
        endOfLine: "auto",
        printWidth: 120,
        tabWidth: 2,
        arrowParens: "always",
        bracketSpacing: true,
        importOrder: ["<THIRD_PARTY_MODULES>", "^[./]"],
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
      },
    ],
    "react/jsx-filename-extension": "off",
    "@typescript-eslint/no-throw-literal": "off",
    "no-debugger": "warn",
    "no-console": "warn",
    "import/prefer-default-export": "off",
    "import/no-unresolved": "warn",
    "no-plusplus": "off",
    "import/named": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-param-reassign": "off",
    "@typescript-eslint/naming-convention": "warn",
    "@typescript-eslint/no-shadow": "warn",
    "@typescript-eslint/ban-types": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "import/no-extraneous-dependencies": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "import/newline-after-import": "error",
    "import/order": [
      "error",
      {
        groups: [["builtin", "external"], "internal"],
        "newlines-between": "always",
      },
    ],
    "no-multiple-empty-lines": [
      "error",
      {
        max: 1,
        maxEOF: 1,
      },
    ],
    "padding-line-between-statements": [
      "error",
      {
        blankLine: "always",
        prev: "export",
        next: ["expression", "const"],
      },
    ],
  },
};
