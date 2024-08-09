import type {
  SIWSConfig,
  SIWSSession,
  SIWSCreateMessageArgs,
  SIWSVerifyMessageArgs,
  SIWSClientMethods
} from '../core/utils/TypeUtils.js'
import { Web3ModalSIWSClient } from '../src/client.js'
export { verifySignature } from '../core/helpers/index.js'
export { getDidChainId, getDidAddress } from '@walletconnect/utils'
export { SIWSController, type SIWSControllerClient } from '../core/controller/SIWSController.js'
export { formatMessage } from '../core/utils/formatMessage.js'

export type {
  Web3ModalSIWSClient,
  SIWSConfig,
  SIWSSession,
  SIWSCreateMessageArgs,
  SIWSVerifyMessageArgs,
  SIWSClientMethods
}

export function createSIWSConfig(siwsConfig: SIWSConfig) {
  return new Web3ModalSIWSClient(siwsConfig)
}

export * from '../scaffold/partials/w3m-connecting-siws/index.js'
export * from '../scaffold/views/w3m-connecting-siws-view/index.js'
