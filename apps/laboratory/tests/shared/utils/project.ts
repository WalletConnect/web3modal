import { devices } from '@playwright/test'
import { getAvailableDevices } from './device'
import { getValue } from './config'
import { getLocalBravePath, BRAVE_LINUX_PATH } from '../constants/browsers'

const availableDevices = getAvailableDevices()

const LIBRARIES = ['ethers', 'wagmi', 'solana'] as const

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

const EMAIL_BASED_PLATFORM_REGEX =
  /(?:email\.spec\.ts|smart-account\.spec\.ts|siwe-email\.spec\.ts|siwe-sa\.spec\.ts|social\.spec\.ts).*$/u

const SOLANA_UNIMPLEMENTED_TESTS_REGEX =
  /^(?!.*(?:email\.spec\.ts|siwe\.spec\.ts|canary\.spec\.ts|smart-account\.spec\.ts|social\.spec\.ts|siwe-sa\.spec\.ts|siwe-email\.spec\.ts|verify\.spec\.ts)).*$/u

const customProjectProperties: CustomProjectProperties = {
  'Desktop Chrome/ethers': {
    testIgnore: /(?:social\.spec\.ts|verify\.spec\.ts).*$/u
  },
  'Desktop Brave/ethers': {
    testIgnore: /(?:email\.spec\.ts|smart-account\.spec\.ts|social\.spec\.ts|verify\.spec\.ts).*$/u,
    useOptions: braveOptions
  },
  'Desktop Firefox/ethers': {
    testIgnore: /(?:social\.spec\.ts|verify\.spec\.ts).*$/u
  },
  'Desktop Brave/wagmi': {
    testIgnore: EMAIL_BASED_PLATFORM_REGEX,
    useOptions: braveOptions
  },
  'Desktop Chrome/wagmi': {
    testIgnore: EMAIL_BASED_PLATFORM_REGEX
  },
  'Desktop Firefox/wagmi': {
    testIgnore: EMAIL_BASED_PLATFORM_REGEX
  },
  // Exclude social.spec.ts, email.spec.ts, siwe.spec.ts, and canary.spec.ts from solana, not yet implemented
  'Desktop Chrome/solana': {
    grep: SOLANA_UNIMPLEMENTED_TESTS_REGEX
  },
  'Desktop Brave/solana': {
    useOptions: braveOptions,
    grep: SOLANA_UNIMPLEMENTED_TESTS_REGEX
  },
  'Desktop Firefox/solana': {
    grep: SOLANA_UNIMPLEMENTED_TESTS_REGEX
  },
  'Desktop Safari/solana': {
    grep: SOLANA_UNIMPLEMENTED_TESTS_REGEX
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
