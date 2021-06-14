module.exports = {
  "plugins": ["jasmine"],
  "env": {
    "browser": true,
    "es2021": true,
    "jasmine": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": [
      1,
      {"argsIgnorePattern": "^_"}
    ]
  },
};
