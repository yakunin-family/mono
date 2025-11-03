import { config as reactConfig } from "@mono/eslint/react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["src/routeTree.gen.ts"]),
  ...reactConfig,
]);
