import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["temp/**", "test/**", "types/**", "dist/**", "docs/**", "app/**"], // ✅ ignore these folders completely
  },

  // Base JS config for src
  {
    files: [
      "src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "benchmark/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // TypeScript configs
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["src/**/*.{ts,tsx}", "benchmark/**/*.{ts,tsx}"],
  })),
]);
