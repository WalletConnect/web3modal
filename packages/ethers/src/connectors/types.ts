import type { EthersStoreUtilState } from '../utils/EthersStoreUtil.js'
import type { Provider } from '../utils/EthersTypesUtil.js'

export type Connector = {
  id: string
  type: EthersStoreUtilState['providerType']
  checkActive: () => void
  setProvider: (provider: Provider) => Promise<void>
  watch: () => void
  // prettier-ignore
  getProvider: () => (Promise<Provider | undefined> | Provider | undefined)
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
}
