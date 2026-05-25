import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "client/src"),
      "@server": path.resolve(__dirname, "server"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./client/src/test-setup.ts"],
  },
});
