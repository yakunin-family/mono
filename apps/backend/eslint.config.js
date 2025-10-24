import { config as baseConfig } from "@mono/eslint/base";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
