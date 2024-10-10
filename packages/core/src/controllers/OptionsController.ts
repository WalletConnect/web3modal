import { proxy } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { ConstantsUtil } from '../utils/ConstantsUtil.js'
import type {
  CustomWallet,
  Features,
  Metadata,
  ProjectId,
  SdkVersion,
  Tokens
} from '../utils/TypeUtil.js'

// -- Types --------------------------------------------- //
export interface OptionsControllerStatePublic {
  /**
   * A boolean that allows you to add or remove the "All Wallets" button on the modal
   * @default 'SHOW'
   * @see https://docs.reown.com/appkit/react/core/options#allwallets
   */
  allWallets?: 'SHOW' | 'HIDE' | 'ONLY_MOBILE'
  /**
   * The project ID for the AppKit. You can find or create your project ID in the Cloud.
   * @see https://cloud.walletconnect.com/
   */
  projectId: ProjectId
  /**
   * Array of wallet ids to be shown in the modal's connection view with priority. These wallets will also show up first in `All Wallets` view
   * @default []
   * @see https://docs.reown.com/appkit/react/core/options#featuredwalletids
   */
  featuredWalletIds?: string[]
  /**
   * Array of wallet ids to be shown (order is respected). Unlike `featuredWalletIds`, these wallets will be the only ones shown in `All Wallets` view and as recommended wallets.
   * @default []
   * @see https://docs.reown.com/appkit/react/core/options#includewalletids
   */
  includeWalletIds?: string[]
  /**
   * Array of wallet ids to be excluded from the wallet list in the modal.
   * @default []
   * @see https://docs.reown.com/appkit/react/core/options#excludewalletids
   */
  excludeWalletIds?: string[]
  /**
   * Array of tokens to show the user's balance of. Each key represents the chain id of the token's blockchain
   * @default {}
   * @see https://docs.reown.com/appkit/react/core/options#tokens
   */
  tokens?: Tokens
  /**
   * Add custom wallets to the modal. CustomWallets is an array of objects, where each object contains specific information of a custom wallet.
   * @default []
   * @see https://docs.reown.com/appkit/react/core/options#customwallets
   *
   */
  customWallets?: CustomWallet[]
  /**
   * You can add an url for the terms and conditions link.
   * @default undefined
   */
  termsConditionsUrl?: string
  /**
   * You can add an url for the privacy policy link.
   * @default undefined
   */
  privacyPolicyUrl?: string
  /**
   * Set of fields that related to your project which will be used to populate the metadata of the modal.
   * @default {}
   */
  metadata?: Metadata
  /**
   * Enable or disable the appending the AppKit to the DOM. Created for specific use cases like WebGL.
   * @default false
   */
  disableAppend?: boolean
  enableAuth?: boolean
  /**
   * Enable or disable the all the wallet options (injected, Coinbase, QR, etc.). This is useful if you want to use only email and socials.
   * @default true
   */
  enableWallets?: boolean
  /**
   * Enable or disable the EIP6963 feature in your AppKit.
   * @default false
   */
  enableEIP6963?: boolean
  /**
   * Enable or disable the Coinbase wallet in your AppKit.
   * @default true
   */
  enableCoinbase?: boolean
  /**
   * Enable or disable the Injected wallet in your AppKit.
   * @default true
   */
  enableInjected?: boolean
  /**
   * Enable or disable the WalletConnect QR code in your AppKit.
   * @default true
   */
  enableWalletConnect?: boolean
  /**
   * Enable or disable debug mode in your AppKit. This is useful if you want to see UI alerts when debugging.
   * @default false
   */
  debug?: boolean
  /**
   * Features configuration object.
   * @default { swaps: true, onramp: true, email: true, socials: ['google', 'x', 'discord', 'farcaster', 'github', 'apple', 'facebook'], history: true, analytics: true, allWallets: true }
   * @see https://docs.reown.com/appkit/react/core/options#features
   */
  features?: Features
}

export interface OptionsControllerStateInternal {
  sdkType: 'appkit'
  sdkVersion: SdkVersion
  isSiweEnabled?: boolean
  isUniversalProvider?: boolean
  hasMultipleAddresses?: boolean
}

type StateKey = keyof OptionsControllerStatePublic | keyof OptionsControllerStateInternal
type OptionsControllerState = OptionsControllerStatePublic & OptionsControllerStateInternal

// -- State --------------------------------------------- //
const state = proxy<OptionsControllerState & OptionsControllerStateInternal>({
  features: ConstantsUtil.DEFAULT_FEATURES,
  projectId: '',
  sdkType: 'appkit',
  sdkVersion: 'html-wagmi-undefined'
})

// -- Controller ---------------------------------------- //
export const OptionsController = {
  state,

  subscribeKey<K extends StateKey>(key: K, callback: (value: OptionsControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setOptions(options: OptionsControllerState) {
    Object.assign(state, options)
  },

  setFeatures(features: OptionsControllerState['features'] | undefined) {
    if (!features) {
      return
    }

    Object.entries(features).forEach(([key, value]) => {
      if (!state.features) {
        state.features = ConstantsUtil.DEFAULT_FEATURES
      }
      if (key in state.features) {
        ;(state.features as Record<keyof Features, unknown>)[key as keyof Features] = value
      }
    })
  },

  setProjectId(projectId: OptionsControllerState['projectId']) {
    state.projectId = projectId
  },

  setAllWallets(allWallets: OptionsControllerState['allWallets']) {
    state.allWallets = allWallets
  },

  setIncludeWalletIds(includeWalletIds: OptionsControllerState['includeWalletIds']) {
    state.includeWalletIds = includeWalletIds
  },

  setExcludeWalletIds(excludeWalletIds: OptionsControllerState['excludeWalletIds']) {
    state.excludeWalletIds = excludeWalletIds
  },

  setFeaturedWalletIds(featuredWalletIds: OptionsControllerState['featuredWalletIds']) {
    state.featuredWalletIds = featuredWalletIds
  },

  setTokens(tokens: OptionsControllerState['tokens']) {
    state.tokens = tokens
  },

  setTermsConditionsUrl(termsConditionsUrl: OptionsControllerState['termsConditionsUrl']) {
    state.termsConditionsUrl = termsConditionsUrl
  },

  setPrivacyPolicyUrl(privacyPolicyUrl: OptionsControllerState['privacyPolicyUrl']) {
    state.privacyPolicyUrl = privacyPolicyUrl
  },

  setCustomWallets(customWallets: OptionsControllerState['customWallets']) {
    state.customWallets = customWallets
  },

  setIsSiweEnabled(isSiweEnabled: OptionsControllerState['isSiweEnabled']) {
    state.isSiweEnabled = isSiweEnabled
  },

  setIsUniversalProvider(isUniversalProvider: OptionsControllerState['isUniversalProvider']) {
    state.isUniversalProvider = isUniversalProvider
  },

  setSdkVersion(sdkVersion: OptionsControllerState['sdkVersion']) {
    state.sdkVersion = sdkVersion
  },

  setMetadata(metadata: OptionsControllerState['metadata']) {
    state.metadata = metadata
  },

  setDisableAppend(disableAppend: OptionsControllerState['disableAppend']) {
    state.disableAppend = disableAppend
  },

  setEnableAuth(enableAuth: OptionsControllerState['enableAuth']) {
    state.enableAuth = enableAuth
    if (enableAuth) {
      state.isSiweEnabled = enableAuth
    }
  },

  setEIP6963Enabled(enableEIP6963: OptionsControllerState['enableEIP6963']) {
    state.enableEIP6963 = enableEIP6963
  },

  setDebug(debug: OptionsControllerState['debug']) {
    state.debug = debug
  },

  setEnableWalletConnect(enableWalletConnect: OptionsControllerState['enableWalletConnect']) {
    state.enableWalletConnect = enableWalletConnect
  },

  setEnableWallets(enableWallets: OptionsControllerState['enableWallets']) {
    state.enableWallets = enableWallets
  },

  setHasMultipleAddresses(hasMultipleAddresses: OptionsControllerState['hasMultipleAddresses']) {
    state.hasMultipleAddresses = hasMultipleAddresses
  }
}
