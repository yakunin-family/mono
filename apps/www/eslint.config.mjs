import { defineConfig } from "eslint/config";
import { config as baseConfig } from "@tooling/eslint/base";
import globals from "globals";

export default defineConfig([
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
]);
