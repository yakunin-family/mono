import { config as reactConfig } from "@tooling/eslint/react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["src/routeTree.gen.ts"]),
  ...reactConfig,
]);
