import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), tailwindcss(), dts({ rollupTypes: true, tsconfigPath: './tsconfig.json' })],
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
    },
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
  },
});
