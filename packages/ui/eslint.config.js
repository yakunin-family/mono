import { defineConfig } from "eslint/config";
import { config as reactConfig } from "@mono/eslint/react";

export default defineConfig([...reactConfig]);
