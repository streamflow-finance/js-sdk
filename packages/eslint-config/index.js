/** @type {import('eslint').Linter.BaseConfig} **/
module.exports = {
  extends: [
    "airbnb-typescript",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["@typescript-eslint", "import"],
  env: {
    browser: true,
    es6: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
  },
  ignorePatterns: ["**/dist/**/*"],
  rules: {
    "react/jsx-filename-extension": "off",
    "@typescript-eslint/no-throw-literal": "off",
    "no-debugger": "warn",
    "no-console": ["warn", { allow: ["warn"] }],
    "import/prefer-default-export": "off",
    "import/no-unresolved": "warn",
    quotes: "off",
    "@typescript-eslint/quotes": "off",
    "no-plusplus": "off",
    "import/named": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-param-reassign": "off",
    "@typescript-eslint/naming-convention": "warn",
    "@typescript-eslint/no-shadow": "warn",
    "@typescript-eslint/ban-types": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "import/no-extraneous-dependencies": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/indent": "off",
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
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "": "never",
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
  },
  overrides: [
    {
      // Disable specific TypeScript rules for test files
      files: ["**/*.spec.ts", "**/*.test.ts", "**/__tests__/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
