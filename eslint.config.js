import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Core no-unused-vars doesn't know a locally-scoped identifier used
      // only as a JSX tag name (e.g. a destructured `{ Icon }`) counts as a
      // reference — this rule teaches it that.
      "react/jsx-uses-vars": "error",
      // Just the two long-standing, stable hook rules. The plugin's full
      // "recommended" set in this version is the newer React-Compiler-era
      // rule family (purity/immutability/set-state-in-effect/etc.), which
      // flags this codebase's ordinary useEffect-based data fetching.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" }],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];
