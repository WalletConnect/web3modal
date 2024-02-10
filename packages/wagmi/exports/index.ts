import type { Web3ModalOptions, CoreConfig } from '../src/client.js'
import { Web3Modal } from '../src/client.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'

export type { Web3ModalOptions } from '../src/client.js'
export { defaultWagmiConfig } from '../src/utils/defaultWagmiCoreConfig.js'
export { authConnector } from '../src/connectors/AuthConnector.js'

export function createWeb3Modal(options: Web3ModalOptions<CoreConfig>) {
  return new Web3Modal({ ...options, _sdkVersion: `html-wagmi-${ConstantsUtil.VERSION}` })
}
