import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: !options.watch,
  outDir: "dist",
  sourcemap: options.watch ? "inline" : false,
  external: [
    "react",
    "react/jsx-runtime",
    "@tanstack/react-query",
    "@mono/ui",
  ],
  outExtension: () => ({ js: ".js" }),
}));
