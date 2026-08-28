import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party render assets, never linted.
    "src/render/vendor/**",
    // Design studies and logo tooling, never linted.
    "design/**",
    // Gitignored runtime storage and render scratch dirs.
    "data/**",
  ]),
]);

export default eslintConfig;
