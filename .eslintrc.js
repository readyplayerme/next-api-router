const rules = {
  "max-len": [
    "error",
    { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true },
  ],
  "no-underscore-dangle": ["error", { allow: ["_id"] }],
  "import/prefer-default-export": "off",
  "import/extensions": [
    "error",
    "ignorePackages",
    {
      js: "never",
      ts: "never",
    },
  ],
  semi: ["error", "always"],
  "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
  "no-use-before-define": "off",
  "@typescript-eslint/no-use-before-define": "off",
  "prefer-destructuring": [
    "error",
    {
      AssignmentExpression: {
        array: false,
        object: false,
      },
    },
    {
      enforceForRenamedProperties: false,
    },
  ],
  curly: "error",
  "import/no-extraneous-dependencies": [
    "error",
    {
      devDependencies: [
        "tests/**/*.spec.ts",
        "tests/**/*.test.ts",
        "test.ts",
        "spec.ts",
        "test-*.ts",
        "jest.config.js",
        "jest.setup.js",
        "vue.config.js",
        ".eslintrc.js",
        "tests/**/browser.js",
        "tests/**/browser_iframe.js",
      ],
      optionalDependencies: false,
    },
  ],
  "@typescript-eslint/naming-convention": [
    "warn",
    {
      selector: "variable",
      format: ["camelCase", "PascalCase", "UPPER_CASE"],
      leadingUnderscore: "allow",
    },
    {
      selector: "property",
      format: ["camelCase", "PascalCase", "UPPER_CASE"],
      leadingUnderscore: "allowSingleOrDouble",
    },
    {
      selector: "function",
      format: ["camelCase", "PascalCase"],
    },
    {
      selector: "typeLike",
      format: ["PascalCase"],
    },
  ],
};

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  env: {
    es2021: true,
    browser: true,
    node: true,
    jest: true,
  },
  extends: [
    "airbnb",
    "airbnb/hooks",
    "plugin:import/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "prettier",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  plugins: ["import", "jest", "prettier"],
  rules,
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts", ".js", ".json"],
      },
    },
    "import/extensions": [".ts", ".d.ts", ".js"],
    "import/external-module-folders": ["node_modules", "node_modules/@types"],
  },
  overrides: [
    {
      files: ["*.ts"],
      extends: [
        "airbnb-typescript",
        "airbnb/hooks",
        "plugin:import/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "prettier",
        "plugin:@typescript-eslint/recommended",
      ],
      plugins: ["import", "prettier", "@typescript-eslint"],
      parserOptions: {
        project: "./tsconfig.json",
      },
      settings: {
        "import/resolver": {
          node: {
            extensions: [".ts", ".json", ".d.ts", ".js"],
          },
        },
        "import/parsers": {
          "@typescript-eslint/parser": [".ts", ".d.ts", ".js"],
        },
      },
      rules: {
        ...rules,
        "constructor-super": "off",
        "getter-return": "off",
        "no-const-assign": "off",
        "no-dupe-args": "off",
        "no-dupe-class-members": "off",
        "no-dupe-keys": "off",
        "no-func-assign": "off",
        "no-new-symbol": "off",
        "no-obj-calls": "off",
        "no-redeclare": "off",
        "no-this-before-super": "off",
        "no-undef": "off",
        "no-unreachable": "off",
        "no-unsafe-negation": "off",
        "valid-typeof": "off",
        "import/named": "off",
        "import/no-unresolved": "off",
      },
    },
    {
      files: ["tests/**/*.ts"],
      parserOptions: {
        project: "./tests/tsconfig.json",
      },
    },
  ],
};
