import { defineConfig, devices } from '@playwright/test'
import { BASE_URL } from './tests/shared/constants'

import { config } from 'dotenv'
import type { ModalFixture } from './tests/shared/fixtures/w3m-fixture'
import { DEVICES } from './tests/shared/constants/devices'
config({ path: './.env' })
const availableDevices = DEVICES

const LIBRARIES = ['wagmi', 'ethers'] as const
const PERMUTATIONS = availableDevices.flatMap(device =>
  LIBRARIES.map(library => ({ device, library }))
)

export default defineConfig<ModalFixture>({
  testDir: './tests',

  fullyParallel: true,
  retries: 2,
  workers: 8,
  reporter: process.env['CI']
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { host: '0.0.0.0' }]],

  expect: {
    timeout: (process.env['CI'] ? 60 : 15) * 1000
  },
  timeout: 60 * 1000,

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Take a screenshot when the test fails */
    screenshot: 'only-on-failure',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: PERMUTATIONS.map(({ device, library }) => ({
    name: `${device}/${library}`,
    use: { ...devices[device], library }
  })),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run playwright:start',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'] || Boolean(process.env['SKIP_PLAYWRIGHT_WEBSERVER'])
  }
})
