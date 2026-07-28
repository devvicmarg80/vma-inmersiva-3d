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
    // AppleDouble sidecar files (._*) — this project lives on an exFAT
    // volume that generates one per real file. Already in .gitignore;
    // excluded here too so `eslint`/`next build` don't try to parse them.
    "**/._*",
  ]),
  // Vendored animation engine, ported from next16-claude-starter. Its own
  // hard rules treat these paths as do-not-modify-without-sign-off (they're
  // the animation primitives every section is built on, not app code), so
  // they're exempt from the stricter app-level rules rather than rewritten.
  {
    files: [
      "src/components/animation/springs/**",
      "src/hooks/animation/**",
      "src/hooks/smooth-scroll/**",
      "src/lib/animation/**",
      "src/lib/springs/**",
      "src/layouts/scroll-layout.tsx",
      "src/utils/animation/**",
      "src/utils/math.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
