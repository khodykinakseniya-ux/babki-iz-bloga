const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] } },
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
    { command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175/babki-iz-bloga/', reuseExistingServer: true },
  ],
});
