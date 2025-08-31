module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    // General rules
    'no-console': 'off', // Allow console.log for server logging
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'eqeqeq': ['error', 'always'],
    'curly': 'off',
    'semi': ['error', 'always'],
    'no-undef': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '!.eslintrc.js',
    '!jest.config.js'
  ]
};
