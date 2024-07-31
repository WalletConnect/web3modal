import type {
  SIWEClientMethods,
  SIWEConfig,
  SIWECreateMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs
} from '../core/utils/TypeUtils.js'
import { Web3ModalSIWEClient } from '../src/client.js'
export { formatMessage, getDidAddress, getDidChainId } from '@walletconnect/utils'
export { SIWEController, type SIWEControllerClient } from '../core/controller/SIWEController.js'
export {
  getAddressFromMessage,
  getChainIdFromMessage,
  verifySignature
} from '../core/helpers/index.js'
export { useSiweSession } from '../core/hooks/react.js'
export * from '../core/utils/AppKitAuthUtil.js'

export type {
  SIWEClientMethods,
  SIWEConfig,
  SIWECreateMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs,
  Web3ModalSIWEClient
}

export * from '../scaffold/partials/w3m-connecting-siwe/index.js'
export * from '../scaffold/views/w3m-connecting-siwe-view/index.js'

export function createSIWEConfig(siweConfig: SIWEConfig) {
  return new Web3ModalSIWEClient(siweConfig)
}
