import { createConnector, normalizeChainId, type CreateConfigParameters } from '@wagmi/core'
import { W3mFrameHelpers, W3mFrameProvider } from '@web3modal/wallet'
import { SwitchChainError, getAddress } from 'viem'
import type { Address } from 'viem'

import { ConstantsUtil } from '@web3modal/scaffold-utils'

// -- Types ----------------------------------------------------------------------------------------
interface W3mFrameProviderOptions {
  projectId: string
}

interface ConnectOptions {
  chainId?: number
}

export type EmailParameters = {
  chains?: CreateConfigParameters['chains']
  options: W3mFrameProviderOptions
}

// -- Connector ------------------------------------------------------------------------------------
export function emailConnector(parameters: EmailParameters) {
  type Properties = {
    provider?: W3mFrameProvider
  }

  return createConnector<W3mFrameProvider, Properties>(config => ({
    id: ConstantsUtil.EMAIL_CONNECTOR_ID,
    name: 'Web3Modal Email',
    type: 'w3mEmail',

    async connect(options: ConnectOptions = {}) {
      const provider = await this.getProvider()
      const preferredAccountType = W3mFrameHelpers.getPreferredAccountType()
      const [{ address, chainId }] = await Promise.all([
        provider.connect({
          chainId: options.chainId,
          preferredAccountType
        }),
        provider.getSmartAccountEnabledNetworks()
      ])

      return {
        accounts: [address as Address],
        account: address as Address,
        chainId,
        chain: {
          id: chainId,
          unsuported: false
        }
      }
    },

    async disconnect() {
      const provider = await this.getProvider()
      await provider.disconnect()
    },

    async getAccounts() {
      const provider = await this.getProvider()
      const preferredAccountType = W3mFrameHelpers.getPreferredAccountType()
      const { address } = await provider.connect({ preferredAccountType })
      config.emitter.emit('change', { accounts: [address as Address] })

      return [address as Address]
    },

    async getProvider() {
      if (!this.provider) {
        this.provider = new W3mFrameProvider(parameters.options.projectId)
      }

      return Promise.resolve(this.provider)
    },

    async getChainId() {
      const provider: W3mFrameProvider = await this.getProvider()
      const { chainId } = await provider.getChainId()

      return chainId
    },

    async isAuthorized() {
      const provider = await this.getProvider()
      const { isConnected } = await provider.isConnected()

      return isConnected
    },

    async switchChain({ chainId }) {
      try {
        const chain = config.chains.find(c => c.id === chainId)
        if (!chain) {
          throw new SwitchChainError(new Error('chain not found on connector.'))
        }
        const provider = await this.getProvider()
        await provider.switchNetwork(chainId)
        config.emitter.emit('change', { chainId: normalizeChainId(chainId) })

        return chain
      } catch (error) {
        if (error instanceof Error) {
          throw new SwitchChainError(error)
        }
        throw error
      }
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect()
      } else {
        config.emitter.emit('change', { accounts: accounts.map(getAddress) })
      }
    },

    onChainChanged(chain) {
      const chainId = normalizeChainId(chain)
      config.emitter.emit('change', { chainId })
    },

    async onConnect(connectInfo) {
      const chainId = normalizeChainId(connectInfo.chainId)
      const accounts = await this.getAccounts()
      config.emitter.emit('connect', { accounts, chainId })
    },

    async onDisconnect(_error) {
      const provider = await this.getProvider()
      await provider.disconnect()
    }
  }))
}
