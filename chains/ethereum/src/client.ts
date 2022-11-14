import type { Chain, Client, Connector } from '@wagmi/core'
import { connect, disconnect, getAccount, watchAccount } from '@wagmi/core'
import type { ConnectorId } from './types'

export class EthereumClient {
  private readonly wagmi = {} as Client
  public readonly chains = [] as Chain[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(wagmi: any, chains: Chain[]) {
    this.wagmi = wagmi
    this.chains = chains
  }

  // -- private
  private getDefaultConnectorChainId(connector: Connector) {
    return connector.chains[0].id
  }

  // -- public web3modal
  public getConnectorById(id: ConnectorId) {
    const connector = this.wagmi.connectors.find(item => item.id === id)
    if (!connector) throw new Error(`Missing ${id} connector`)

    return connector
  }

  public async connectWalletConnect(onUri: (uri: string) => void, selectedChainId?: number) {
    const connector = this.getConnectorById('walletConnect')
    const chainId = selectedChainId ?? this.getDefaultConnectorChainId(connector)

    async function getProviderUri() {
      return new Promise<void>(resolve => {
        connector.once('message', async ({ type }) => {
          if (type === 'connecting') {
            const provider = await connector.getProvider()
            onUri(provider.connector.uri)
            resolve()
          }
        })
      })
    }

    const [data] = await Promise.all([connect({ connector, chainId }), getProviderUri()])

    return data
  }

  public async connectCoinbaseMobile(onUri?: (uri: string) => void, selectedChainId?: number) {
    const connector = this.getConnectorById('coinbaseWallet')
    const chainId = selectedChainId ?? this.getDefaultConnectorChainId(connector)

    async function getProviderUri() {
      return new Promise<void>(resolve => {
        connector.once('message', async ({ type }) => {
          if (type === 'connecting') {
            const provider = await connector.getProvider()
            onUri?.(provider.qrUrl)
            resolve()
          }
        })
      })
    }

    const [data] = await Promise.all([connect({ connector, chainId }), getProviderUri()])

    return data
  }

  public async connectExtension(connectorId: ConnectorId, selectedChainId?: number) {
    const connector = this.getConnectorById(connectorId)
    const chainId = selectedChainId ?? this.getDefaultConnectorChainId(connector)
    const data = await connect({ connector, chainId })

    return data
  }

  public async getActiveWalletConnectUri() {
    const connector = this.getConnectorById('walletConnect')
    const provider = await connector.getProvider()

    return provider.connector.uri
  }

  // -- public wagmi
  public disconnect = disconnect

  public getAccount = getAccount

  public watchAccount = watchAccount
}
