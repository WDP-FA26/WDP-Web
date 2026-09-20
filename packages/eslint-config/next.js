import pluginNext from "@next/eslint-plugin-next";
import { config as reactConfig, shadcn } from "./react-internal.js";

export { shadcn };

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
  {
    ignores: [".next/**", "dist/**", "node_modules/**"],
  },
  ...reactConfig,
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
];
