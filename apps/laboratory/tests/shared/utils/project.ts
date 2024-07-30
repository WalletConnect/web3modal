import { devices } from '@playwright/test'
import { getAvailableDevices } from './device'
import { getValue } from './config'
import { getLocalBravePath, BRAVE_LINUX_PATH } from '../constants/browsers'

const availableDevices = getAvailableDevices()

const LIBRARIES = ['ethers', 'wagmi', 'solana', 'multichain'] as const

const PERMUTATIONS = availableDevices.flatMap(device =>
  LIBRARIES.map(library => ({ device, library }))
)

interface UseOptions {
  launchOptions: {
    executablePath: string
  }
}

interface CustomProperties {
  testIgnore?: RegExp | string
  testMatch?: string
  useOptions?: UseOptions
  grep?: RegExp
}

export type CustomProjectProperties = {
  [T in string]: CustomProperties
}

const braveOptions: UseOptions = {
  launchOptions: {
    executablePath: getValue(BRAVE_LINUX_PATH, getLocalBravePath())
  }
}

const SOLANA_DISABLED_TESTS = [
  'canary.spec.ts',
  'email.spec.ts',
  'siwe.spec.ts',
  'siwe-email.spec.ts',
  'siwe-sa.spec.ts',
  'smart-account.spec.ts',
  'social.spec.ts',
  'wallet-features.spec.ts',
  'wallet.spec.ts'
]
const WAGMI_DISABLED_TESTS = ['smart-account.spec.ts', 'social.spec.ts']
const ETHERS_DISABLED_TESTS = ['wallet-features.spec.ts', 'social.spec.ts']

const ETHERS_EMAIL_BASED_REGEX = new RegExp(ETHERS_DISABLED_TESTS.join('|'), 'u')
const WAGMI_DISABLED_TESTS_REGEX = new RegExp(WAGMI_DISABLED_TESTS.join('|'), 'u')
const SOLANA_DISABLED_TESTS_REGEX = new RegExp(SOLANA_DISABLED_TESTS.join('|'), 'u')

const customProjectProperties: CustomProjectProperties = {
  'Desktop Chrome/ethers': {
    testIgnore: ETHERS_EMAIL_BASED_REGEX
  },
  'Desktop Brave/ethers': {
    testIgnore: ETHERS_EMAIL_BASED_REGEX,
    useOptions: braveOptions
  },
  'Desktop Firefox/ethers': {
    testIgnore: ETHERS_EMAIL_BASED_REGEX
  },
  'Desktop Brave/wagmi': {
    testIgnore: WAGMI_DISABLED_TESTS_REGEX,
    useOptions: braveOptions
  },
  'Desktop Chrome/wagmi': {
    testIgnore: WAGMI_DISABLED_TESTS_REGEX
  },
  'Desktop Firefox/wagmi': {
    testIgnore: WAGMI_DISABLED_TESTS_REGEX
  },
  // Exclude social.spec.ts, email.spec.ts, siwe.spec.ts, and canary.spec.ts from solana, not yet implemented
  'Desktop Chrome/solana': {
    testIgnore: SOLANA_DISABLED_TESTS_REGEX
  },
  'Desktop Brave/solana': {
    useOptions: braveOptions,
    testIgnore: SOLANA_DISABLED_TESTS_REGEX
  },
  'Desktop Firefox/solana': {
    testIgnore: SOLANA_DISABLED_TESTS_REGEX
  },
  'Desktop Safari/solana': {
    testIgnore: SOLANA_DISABLED_TESTS_REGEX
  }
}

export interface Permutation {
  device: string
  library: string
}

export function getProjects() {
  return PERMUTATIONS.map(({ device, library }) => {
    const deviceName = device === 'Desktop Brave' ? 'Desktop Chrome' : device
    let project = {
      name: `${device}/${library}`,
      use: { ...devices[deviceName], library },
      storageState: 'playwright/.auth/user.json'
    }
    const props = customProjectProperties[project.name]
    if (props) {
      project = { ...project, ...props }
      if (props.useOptions) {
        project.use = { ...project.use, ...props.useOptions }
      }
    }

    return project
  })
}
