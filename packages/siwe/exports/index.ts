import type {
  SIWEClientMethods,
  SIWEConfig,
  SIWECreateMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs
} from '../core/utils/TypeUtils.js'
import { AppKitSIWEClient } from '../src/client.js'
export {
  getAddressFromMessage,
  getChainIdFromMessage,
  verifySignature
} from '../core/helpers/index.js'
export { useSiweSession } from '../core/hooks/react.js'
export * from '../core/utils/AppKitAuthUtil.js'

export { formatMessage, getDidAddress, getDidChainId } from '@walletconnect/utils'
export { SIWEController, type SIWEControllerClient } from '../core/controller/SIWEController.js'
export * from '../core/utils/TypeUtils.js'
export type {
  AppKitSIWEClient,
  SIWEClientMethods,
  SIWEConfig,
  SIWECreateMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs
}

export * from '../scaffold/partials/w3m-connecting-siwe/index.js'
export * from '../scaffold/views/w3m-connecting-siwe-view/index.js'

export function createSIWEConfig(siweConfig: SIWEConfig) {
  return new AppKitSIWEClient(siweConfig)
}
