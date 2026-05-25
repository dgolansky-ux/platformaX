import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "client/src"),
      "@server": path.resolve(__dirname, "server"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: "dist",
  },
});
