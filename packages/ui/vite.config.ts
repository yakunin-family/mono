import alias from "@rollup/plugin-alias";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), dts(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    sourcemap: true,
    rollupOptions: {
      external: ["react", "react/jsx-runtime", "lucide-react"],
      plugins: [
        alias({
          entries: [{ find: "@", replacement: resolve(__dirname, "./src") }],
        }),
      ],
    },
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
  },
});
