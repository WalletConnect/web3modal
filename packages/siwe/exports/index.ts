import type {
  SIWEConfig,
  SIWESession,
  SIWECreateMessageArgs,
  SIWEVerifyMessageArgs,
  SIWEClientMethods
} from '../core/utils/TypeUtils.js'
import { Web3ModalSIWEClient } from '../src/client.js'
export { appKitAuthConfig, updateUser } from '../core/utils/AppKitAuthUtil.js'
export {
  getAddressFromMessage,
  getChainIdFromMessage,
  verifySignature
} from '../core/helpers/index.js'
export { formatMessage, getDidChainId, getDidAddress } from '@walletconnect/utils'
export { SIWEController, type SIWEControllerClient } from '../core/controller/SIWEController.js'
export { useSiweSession } from '../core/hooks/react.js'

export type {
  Web3ModalSIWEClient,
  SIWEConfig,
  SIWESession,
  SIWECreateMessageArgs,
  SIWEVerifyMessageArgs,
  SIWEClientMethods
}

export * from '../scaffold/partials/w3m-connecting-siwe/index.js'
export * from '../scaffold/views/w3m-connecting-siwe-view/index.js'
export * from '../scaffold/views/w3m-connecting-siwe-view/index.js'

export function createSIWEConfig(siweConfig: SIWEConfig) {
  return new Web3ModalSIWEClient(siweConfig)
}
