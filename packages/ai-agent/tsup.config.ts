import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  sourcemap: true,
  dts: {
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  clean: true,
  external: ["zod", "@convex-dev/agent", "ai"],
  esbuildOptions(options) {
    options.loader = {
      ...(options.loader ?? {}),
      ".md": "text",
    };
  },
});
