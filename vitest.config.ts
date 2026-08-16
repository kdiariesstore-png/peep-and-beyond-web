import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // tsconfig sets jsx: "preserve" because Next owns the real transform, and Next uses
  // the automatic runtime. Match it here so components that (correctly) don't import
  // React render under test instead of throwing "React is not defined".
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/node_modules/**", "**/.next/**", "**/.claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
