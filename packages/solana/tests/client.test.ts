import { beforeAll, describe, expect, it } from 'vitest'
import { createWeb3Modal, defaultSolanaConfig } from '../exports/index.js'
import { NetworkController, OptionsController } from '@web3modal/core'
import { ConstantsUtil, PresetsUtil } from '@web3modal/scaffold-utils'
import { solana } from '../exports/chains.js'

// -- Constants ----------------------------------------------------------------
const metadata = {
  name: 'Test',
  description: 'Test',
  icons: ['https://test.com/icon.png'],
  url: 'https://test.com',
  verify_url: ''
}
const chains = [solana]

export const solanaConfig = defaultSolanaConfig({
  chains,
  projectId: 'PROJECT_ID',
  metadata
})
// -- Setup -------------------------------------------------------------------
beforeAll(() => {
  createWeb3Modal({
    solanaConfig,
    chains,
    wallets: [],
    projectId: 'PROJECT_ID',
    enableAnalytics: true,
    metadata,
    termsConditionsUrl: 'https://walletconnect.com/terms',
    privacyPolicyUrl: 'https://walletconnect.com/privacy',
    tokens: {
      1: {
        address: '0x123',
        image: 'https://example.com/token.png'
      }
    },
    customWallets: [
      {
        id: 'react-wallet-v2',
        name: 'react-wallet-v2',
        homepage: 'https://react-wallet.walletconnect.com/',
        mobile_link: 'https://react-wallet.walletconnect.com/',
        desktop_link: 'https://react-wallet.walletconnect.com/',
        webapp_link: 'https://react-wallet.walletconnect.com/'
      }
    ],
    allWallets: 'SHOW',
    includeWalletIds: ['8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4'],
    excludeWalletIds: ['c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'],
    featuredWalletIds: ['1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369'],
    allowUnsupportedChain: true
  })
})

// -- Tests --------------------------------------------------------------------
describe('createWeb3Modal by solana', () => {
  it('should set controller states as expected', () => {
    expect(OptionsController.state.projectId).toBe('PROJECT_ID')
    expect(OptionsController.state.allWallets).toBe('SHOW')
    expect(OptionsController.state.includeWalletIds).toEqual([
      '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4'
    ])
    expect(OptionsController.state.excludeWalletIds).toEqual([
      'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'
    ])
    expect(OptionsController.state.featuredWalletIds).toEqual([
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369'
    ])
    expect(OptionsController.state.tokens?.['eip155:1']?.address).toBe('0x123')
    expect(OptionsController.state.termsConditionsUrl).toBe('https://walletconnect.com/terms')
    expect(OptionsController.state.privacyPolicyUrl).toBe('https://walletconnect.com/privacy')
    expect(OptionsController.state.enableAnalytics).toBe(true)
    expect(OptionsController.state.customWallets?.[0]?.id).toEqual('react-wallet-v2')
    expect(OptionsController.state.isUniversalProvider).toBe(undefined)
    expect(OptionsController.state.sdkVersion).toEqual(`html-solana-${ConstantsUtil.VERSION}`)
    expect(OptionsController.state.enableOnramp).toBe(true)
    expect(OptionsController.state.metadata).toEqual(metadata)
    expect(OptionsController.state.disableAppend).toEqual(undefined)
    expect(NetworkController.state.allowUnsupportedChain).toBe(true)
  })

  it('should set networks as expected', () => {
    expect(NetworkController.state.requestedCaipNetworks).toEqual(
      [solana].map(n => ({
        id: `solana:${n.chainId}`,
        name: n.name,
        imageId: PresetsUtil.EIP155NetworkImageIds[n.chainId],
        imageUrl: undefined,
        chain: 'solana'
      }))
    )
  })
})