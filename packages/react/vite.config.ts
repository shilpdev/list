import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src", "../../shared"],
      rollupTypes: true,
    }),
  ],
  build: {
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    lib: {
      entry: "src/index.ts",
      name: "ReactList",
      fileName: "index",
      formats: ["es", "cjs"],
    },
  },
});
