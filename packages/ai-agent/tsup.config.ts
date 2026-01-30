import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  dts: {
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  clean: true,
  external: ["zod"],
  esbuildOptions(options) {
    options.loader = {
      ...(options.loader ?? {}),
      ".md": "text",
    };
  },
});
