import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      '@zama-fhe/relayer-sdk/bundle': path.resolve(__dirname, './__mocks__/zama-fhe-relayer-sdk.ts'),
    },
    conditions: ['browser', 'import', 'module'],
  },
  test: {
    environment: "jsdom",
    pool: "threads",
    testTimeout: 30000,
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["./lib/**", "./hooks/**", "./components/dashboard/**"],
    },
    restoreMocks: true,
  },
});
