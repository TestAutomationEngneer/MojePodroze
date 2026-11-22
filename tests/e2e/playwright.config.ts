import { TIMEZONE } from "@_config/env.config";
import { STORAGE_STATE } from "@_config/storage-state.config";
import { defineConfig, devices } from "@playwright/test";

// Aplikację uruchamiamy osobno: `docker compose up -d --build` (frontend :5173, backend :8000).
export default defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./config/global.setup.ts"),
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    testIdAttribute: "data-testid",
    locale: "pl-PL",
    timezoneId: TIMEZONE,
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-non-logged",
      grepInvert: /@logged/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-logged",
      grep: /@logged/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
  ],
});
