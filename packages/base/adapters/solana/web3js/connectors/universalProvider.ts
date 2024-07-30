import { UniversalProvider as Provider } from '@walletconnect/universal-provider'

import { SolStoreUtil } from '../utils/scaffold/SolanaStoreUtil.js'
import type { WalletConnectAppMetadata } from './walletConnectConnector.js'
import type UniversalProvider from '@walletconnect/universal-provider'
const DEFAULT_LOGGER = 'error'

export class UniversalProviderFactory {
  protected static provider: UniversalProvider | undefined
  protected static relayerRegion: string | undefined
  protected static projectId: string | undefined
  protected static metadata: WalletConnectAppMetadata | undefined

  public static setSettings(params: {
    projectId: string
    relayerRegion: string
    metadata: WalletConnectAppMetadata
    qrcode: boolean
  }) {
    UniversalProviderFactory.relayerRegion = params.relayerRegion
    UniversalProviderFactory.projectId = params.projectId
    UniversalProviderFactory.metadata = params.metadata
  }

  public static async init() {
    UniversalProviderFactory.provider = await Provider.init({
      logger: DEFAULT_LOGGER,
      relayUrl: UniversalProviderFactory.relayerRegion,
      projectId: UniversalProviderFactory.projectId,
      metadata: UniversalProviderFactory.metadata
    })

    // Subscribe to session delete
    UniversalProviderFactory.provider.on('session_delete', () => {
      SolStoreUtil.setAddress('')
    })
  }

  public static async getProvider() {
    if (!UniversalProviderFactory.provider) {
      await UniversalProviderFactory.init()

      if (!UniversalProviderFactory.provider) {
        throw new Error('Failed to initialize universal provider')
      }
    }

    return UniversalProviderFactory.provider
  }
}
