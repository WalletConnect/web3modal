import type { Config } from '@wagmi/core'
import type { Web3ModalOptions } from '../src/client.js'
import { Web3Modal } from '../src/client.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'

export type { Web3Modal, Web3ModalOptions } from '../src/client.js'
export { defaultWagmiConfig } from '../src/utils/defaultWagmiCoreConfig.js'
export { authConnector } from '../src/connectors/AuthConnector.js'
export { emailConnector } from '../src/connectors/EmailConnector.js'

export function createWeb3Modal(options: Web3ModalOptions<Config>) {
  return new Web3Modal({ ...options, _sdkVersion: `html-wagmi-${ConstantsUtil.VERSION}` })
}
