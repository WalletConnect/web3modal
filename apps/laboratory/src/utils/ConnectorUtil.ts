import { createConnector } from '@wagmi/core'

interface ConnectOptions {
  chainId?: number
}

// -- Connector ------------------------------------------------------------------------------------
export function externalTestConnector() {
  type Properties = {
    provider?: () => Record<string, never>
  }

  return createConnector<() => Record<string, never>, Properties>(() => ({
    id: 'externalTestConnector',
    name: 'AppKit external',
    type: 'externalTestConnector',

    async connect(options: ConnectOptions = {}) {
      return Promise.resolve({
        options,
        accounts: [],
        account: '',
        chainId: 0,
        chain: {
          id: 0,
          unsuported: false
        }
      })
    },

    async disconnect() {
      return Promise.resolve()
    },

    async getAccounts() {
      return Promise.resolve([])
    },

    async getProvider() {
      return Promise.resolve(() => ({}))
    },

    async getChainId() {
      return Promise.resolve(0)
    },

    async isAuthorized() {
      return Promise.resolve(false)
    },

    async switchChain({ chainId }) {
      return Promise.resolve({
        chainId,
        rpcUrls: { default: { http: [''] } },
        id: 0,
        name: '',
        nativeCurrency: { name: 'Test', symbol: '', decimals: 10 }
      })
    },

    onAccountsChanged(accounts) {
      return accounts
    },

    onChainChanged(chain) {
      return chain
    },

    async onConnect(connectInfo) {
      return Promise.resolve(connectInfo)
    },

    async onDisconnect(_error) {
      return Promise.resolve()
    }
  }))
}
