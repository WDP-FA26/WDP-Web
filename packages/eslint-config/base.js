import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import { plugin as shadcn } from "@shadcn/lint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      shadcn,
    },
    rules: {
      "shadcn/no-restyle": [
        "error",
        {
          allow: ["layout"],
          contracts: [
            { pattern: "^CardContent$", allow: ["layout", "spacing"] },
            { pattern: "^CardFooter$", allow: ["layout", "spacing"] },
          ],
        },
      ],
      "shadcn/no-raw-colors": "error",
    },
  },
  {
    files: ["**/src/components/**"],
    rules: {
      "shadcn/no-restyle": "off",
    },
  },
  {
    ignores: ["dist/**"],
  },
];

