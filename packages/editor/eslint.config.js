import { defineConfig } from "eslint/config";
import { config as reactConfig } from "@tooling/eslint/react";

export default defineConfig([...reactConfig]);
