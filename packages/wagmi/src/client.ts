/* eslint-disable no-console */
import { EthereumProvider, OPTIONAL_METHODS } from '@walletconnect/ethereum-provider'
import {
  connect,
  disconnect,
  signMessage,
  getBalance,
  getEnsAvatar as wagmiGetEnsAvatar,
  getEnsName,
  switchChain,
  watchAccount,
  watchConnectors,
  waitForTransactionReceipt,
  estimateGas as wagmiEstimateGas,
  writeContract as wagmiWriteContract,
  getAccount,
  getEnsAddress as wagmiGetEnsAddress,
  reconnect
} from '@wagmi/core'
import { mainnet } from 'viem/chains'
import { prepareTransactionRequest, sendTransaction as wagmiSendTransaction } from '@wagmi/core'
import type { Chain } from '@wagmi/core/chains'
import type { Config, GetAccountReturnType } from '@wagmi/core'
import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  Connector,
  LibraryOptions,
  NetworkControllerClient,
  PublicStateControllerState,
  SendTransactionArgs,
  SocialProvider,
  Token,
  WriteContractArgs
} from '@web3modal/scaffold'
import { formatUnits, parseUnits } from 'viem'
import type { Hex } from 'viem'
import { Web3ModalScaffold } from '@web3modal/scaffold'
import type { Web3ModalSIWEClient } from '@web3modal/siwe'
import { ConstantsUtil, PresetsUtil, HelpersUtil } from '@web3modal/scaffold-utils'
import {
  getCaipDefaultChain,
  getEmailCaipNetworks,
  getWalletConnectCaipNetworks
} from './utils/helpers.js'
import { W3mFrameConstants, W3mFrameHelpers, W3mFrameRpcConstants } from '@web3modal/wallet'
import type { W3mFrameProvider, W3mFrameTypes } from '@web3modal/wallet'
import { NetworkUtil } from '@web3modal/common'
import { normalize } from 'viem/ens'

// -- Types ---------------------------------------------------------------------
export interface Web3ModalClientOptions<C extends Config>
  extends Omit<LibraryOptions, 'defaultChain' | 'tokens'> {
  wagmiConfig: C
  siweConfig?: Web3ModalSIWEClient
  defaultChain?: Chain
  chainImages?: Record<number, string>
  connectorImages?: Record<string, string>
  tokens?: Record<number, Token>
}

export type Web3ModalOptions<C extends Config> = Omit<Web3ModalClientOptions<C>, '_sdkVersion'>

// @ts-expect-error: Overriden state type is correct
interface Web3ModalState extends PublicStateControllerState {
  selectedNetworkId: number | undefined
}

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffold {
  private hasSyncedConnectedAccount = false

  private options: Web3ModalClientOptions<Config> | undefined = undefined

  private wagmiConfig: Web3ModalClientOptions<Config>['wagmiConfig']

  public constructor(options: Web3ModalClientOptions<Config>) {
    const { wagmiConfig, siweConfig, defaultChain, tokens, _sdkVersion, ...w3mOptions } = options

    if (!wagmiConfig) {
      throw new Error('web3modal:constructor - wagmiConfig is undefined')
    }

    if (!w3mOptions.projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    const networkControllerClient: NetworkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const chainId = NetworkUtil.caipNetworkIdToNumber(caipNetwork?.id)

        if (chainId) {
          await switchChain(this.wagmiConfig, { chainId })
        }
      },

      getApprovedCaipNetworksData: async () =>
        new Promise(resolve => {
          const connections = new Map(wagmiConfig.state.connections)
          const connection = connections.get(wagmiConfig.state.current || '')

          if (connection?.connector?.id === ConstantsUtil.AUTH_CONNECTOR_ID) {
            resolve(getEmailCaipNetworks())
          } else if (connection?.connector?.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
            const connector = wagmiConfig.connectors.find(
              c => c.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
            )

            resolve(getWalletConnectCaipNetworks(connector))
          }

          resolve({ approvedCaipNetworkIds: undefined, supportsAllNetworks: true })
        })
    }

    const connectionControllerClient: ConnectionControllerClient = {
      connectWalletConnect: async onUri => {
        const connector = wagmiConfig.connectors.find(
          c => c.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
        )
        if (!connector) {
          throw new Error('connectionControllerClient:getWalletConnectUri - connector is undefined')
        }
        const provider = (await connector.getProvider()) as Awaited<
          ReturnType<(typeof EthereumProvider)['init']>
        >

        provider.on('display_uri', data => {
          onUri(data)
        })

        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)
        // Make sure client uses ethereum provider version that supports `authenticate`
        if (siweConfig?.options?.enabled && typeof provider?.authenticate === 'function') {
          const { SIWEController, getDidChainId, getDidAddress } = await import('@web3modal/siwe')
          const siweParams = await siweConfig.getMessageParams()
          // @ts-expect-error - setting requested chains beforehand avoids wagmi auto disconnecting the session when `connect` is called because it things chains are stale
          await connector.setRequestedChainsIds(siweParams.chains)

          const result = await provider.authenticate({
            nonce: await siweConfig.getNonce(),
            methods: [...OPTIONAL_METHODS],
            ...siweParams
          })

          // Auths is an array of signed CACAO objects https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-74.md
          const signedCacao = result?.auths?.[0]
          if (signedCacao) {
            const { p, s } = signedCacao
            const cacaoChainId = getDidChainId(p.iss) || ''
            const address = getDidAddress(p.iss)
            if (address && cacaoChainId) {
              SIWEController.setSession({
                address,
                chainId: parseInt(cacaoChainId, 10)
              })
            }
            try {
              // Kicks off verifyMessage and populates external states
              const message = provider.signer.client.formatAuthMessage({
                request: p,
                iss: p.iss
              })

              await SIWEController.verifyMessage({
                message,
                signature: s.s,
                cacao: signedCacao
              })
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error verifying message', error)
              // eslint-disable-next-line no-console
              await provider.disconnect().catch(console.error)
              // eslint-disable-next-line no-console
              await SIWEController.signOut().catch(console.error)
              throw error
            }
            /*
             * Unassign the connector from the wagmiConfig and allow connect() to reassign it in the next step
             * this avoids case where wagmi throws because the connector is already connected
             * what we need connect() to do is to only setup internal event listeners
             */
            this.wagmiConfig.state.current = ''
          }
        }
        await connect(this.wagmiConfig, { connector, chainId })
      },

      connectExternal: async ({ id, provider, info }) => {
        const connector = wagmiConfig.connectors.find(c => c.id === id)
        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }
        if (provider && info && connector.id === ConstantsUtil.EIP6963_CONNECTOR_ID) {
          // @ts-expect-error Exists on EIP6963Connector
          connector.setEip6963Wallet?.({ provider, info })
        }
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        await connect(this.wagmiConfig, { connector, chainId })
      },

      reconnectExternal: async ({ id }) => {
        const connector = wagmiConfig.connectors.find(c => c.id === id)

        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }

        await reconnect(this.wagmiConfig, { connectors: [connector] })
      },

      checkInstalled: ids => {
        const injectedConnector = this.getConnectors().find(c => c.type === 'INJECTED')

        if (!ids) {
          return Boolean(window.ethereum)
        }

        if (injectedConnector) {
          if (!window?.ethereum) {
            return false
          }

          return ids.some(id => Boolean(window.ethereum?.[String(id)]))
        }

        return false
      },

      disconnect: async () => {
        await disconnect(this.wagmiConfig)
        if (siweConfig?.options?.signOutOnDisconnect) {
          const { SIWEController } = await import('@web3modal/siwe')
          await SIWEController.signOut()
        }
      },

      signMessage: async message => signMessage(this.wagmiConfig, { message }),

      estimateGas: async args => {
        try {
          return await wagmiEstimateGas(this.wagmiConfig, {
            account: args.address,
            to: args.to,
            data: args.data,
            type: 'legacy'
          })
        } catch (error) {
          return 0n
        }
      },

      sendTransaction: async (data: SendTransactionArgs) => {
        const { chainId } = getAccount(this.wagmiConfig)

        const txParams = {
          account: data.address,
          to: data.to,
          value: data.value,
          gas: data.gas,
          gasPrice: data.gasPrice,
          data: data.data,
          chainId,
          type: 'legacy' as const
        }

        await prepareTransactionRequest(this.wagmiConfig, txParams)
        const tx = await wagmiSendTransaction(this.wagmiConfig, txParams)

        await waitForTransactionReceipt(this.wagmiConfig, { hash: tx, timeout: 25000 })

        return tx
      },

      writeContract: async (data: WriteContractArgs) => {
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        const tx = await wagmiWriteContract(wagmiConfig, {
          chainId,
          address: data.tokenAddress,
          abi: data.abi,
          functionName: data.method,
          args: [data.receiverAddress, data.tokenAmount]
        })

        return tx
      },

      getEnsAddress: async (value: string) => {
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        if (chainId !== mainnet.id) {
          return false
        }

        const address = await wagmiGetEnsAddress(this.wagmiConfig, {
          name: normalize(value),
          chainId
        })

        return address || false
      },

      getEnsAvatar: async (value: string) => {
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        if (chainId !== mainnet.id) {
          return false
        }

        const avatar = await wagmiGetEnsAvatar(this.wagmiConfig, {
          name: normalize(value),
          chainId
        })

        return avatar || false
      },

      parseUnits,

      formatUnits
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      siweControllerClient: siweConfig,
      defaultChain: getCaipDefaultChain(defaultChain),
      tokens: HelpersUtil.getCaipTokens(tokens),
      _sdkVersion: _sdkVersion ?? `html-wagmi-${ConstantsUtil.VERSION}`,
      ...w3mOptions
    })

    this.options = options
    this.wagmiConfig = wagmiConfig

    this.syncRequestedNetworks([...wagmiConfig.chains])
    this.syncConnectors([...wagmiConfig.connectors])
    this.initAuthConnectorListeners([...wagmiConfig.connectors])

    watchConnectors(this.wagmiConfig, {
      onChange: connectors => this.syncConnectors(connectors)
    })
    watchAccount(this.wagmiConfig, {
      onChange: accountData => this.syncAccount({ ...accountData })
    })
  }

  // -- Public ------------------------------------------------------------------

  // @ts-expect-error: Overriden state type is correct
  public override getState() {
    const state = super.getState()

    return {
      ...state,
      selectedNetworkId: NetworkUtil.caipNetworkIdToNumber(state.selectedNetworkId)
    }
  }

  // @ts-expect-error: Overriden state type is correct
  public override subscribeState(callback: (state: Web3ModalState) => void) {
    return super.subscribeState(state =>
      callback({
        ...state,
        selectedNetworkId: NetworkUtil.caipNetworkIdToNumber(state.selectedNetworkId)
      })
    )
  }

  // -- Private -----------------------------------------------------------------
  private syncRequestedNetworks(chains: Chain[]) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${ConstantsUtil.EIP155}:${chain.id}`,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.id],
          imageUrl: this.options?.chainImages?.[chain.id]
        }) as CaipNetwork
    )
    this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async syncAccount({
    address,
    isConnected,
    chainId,
    connector
  }: Pick<GetAccountReturnType, 'address' | 'isConnected' | 'chainId' | 'connector'>) {
    this.resetAccount()
    this.syncNetwork(address, chainId, isConnected)
    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`
      this.setIsConnected(isConnected)
      this.setCaipAddress(caipAddress)
      await Promise.all([
        this.syncProfile(address, chainId),
        this.syncBalance(address, chainId),
        this.syncConnectedWalletInfo(connector),
        this.getApprovedCaipNetworksData()
      ])
      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.resetWcConnection()
      this.resetNetwork()
    }
  }

  private async syncNetwork(address?: Hex, chainId?: number, isConnected?: boolean) {
    const chain = this.wagmiConfig.chains.find((c: Chain) => c.id === chainId)

    if (chain || chainId) {
      const name = chain?.name ?? chainId?.toString()
      const id = Number(chain?.id ?? chainId)
      const caipChainId: CaipNetworkId = `${ConstantsUtil.EIP155}:${id}`
      this.setCaipNetwork({
        id: caipChainId,
        name,
        imageId: PresetsUtil.EIP155NetworkImageIds[id],
        imageUrl: this.options?.chainImages?.[id]
      })
      if (isConnected && address && chainId) {
        const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${id}:${address}`
        this.setCaipAddress(caipAddress)
        if (chain?.blockExplorers?.default?.url) {
          const url = `${chain.blockExplorers.default.url}/address/${address}`
          this.setAddressExplorerUrl(url)
        } else {
          this.setAddressExplorerUrl(undefined)
        }
        if (this.hasSyncedConnectedAccount) {
          await this.syncProfile(address, chainId)
          await this.syncBalance(address, chainId)
        }
      }
    }
  }

  private async syncProfile(address: Hex, chainId: Chain['id']) {
    try {
      const { name, avatar } = await this.fetchIdentity({
        address
      })
      this.setProfileName(name)
      this.setProfileImage(avatar)
    } catch {
      if (chainId === mainnet.id) {
        const profileName = await getEnsName(this.wagmiConfig, { address, chainId })
        if (profileName) {
          this.setProfileName(profileName)
          const profileImage = await wagmiGetEnsAvatar(this.wagmiConfig, {
            name: profileName,
            chainId
          })
          if (profileImage) {
            this.setProfileImage(profileImage)
          }
        }
      } else {
        this.setProfileName(null)
        this.setProfileImage(null)
      }
    }
  }

  private async syncBalance(address: Hex, chainId: number) {
    const chain = this.wagmiConfig.chains.find((c: Chain) => c.id === chainId)
    if (chain) {
      const balance = await getBalance(this.wagmiConfig, {
        address,
        chainId: chain.id,
        token: this.options?.tokens?.[chain.id]?.address as Hex
      })
      this.setBalance(balance.formatted, balance.symbol)

      return
    }
    this.setBalance(undefined, undefined)
  }

  private async syncConnectedWalletInfo(connector: GetAccountReturnType['connector']) {
    if (!connector) {
      throw Error('syncConnectedWalletInfo - connector is undefined')
    }

    if (connector.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID && connector.getProvider) {
      const walletConnectProvider = (await connector.getProvider()) as Awaited<
        ReturnType<(typeof EthereumProvider)['init']>
      >
      if (walletConnectProvider.session) {
        this.setConnectedWalletInfo({
          ...walletConnectProvider.session.peer.metadata,
          name: walletConnectProvider.session.peer.metadata.name,
          icon: walletConnectProvider.session.peer.metadata.icons?.[0]
        })
      }
    } else {
      this.setConnectedWalletInfo({ name: connector.name, icon: connector.icon })
    }
  }

  private syncConnectors(connectors: Web3ModalClientOptions<Config>['wagmiConfig']['connectors']) {
    const uniqueIds = new Set()
    const filteredConnectors = connectors.filter(
      item => !uniqueIds.has(item.id) && uniqueIds.add(item.id)
    )

    const w3mConnectors: Connector[] = []

    const coinbaseSDKId = ConstantsUtil.COINBASE_SDK_CONNECTOR_ID

    // Check if coinbase injected connector is present
    const coinbaseConnector = filteredConnectors.find(
      c => c.id === ConstantsUtil.CONNECTOR_RDNS_MAP[ConstantsUtil.COINBASE_CONNECTOR_ID]
    )

    filteredConnectors.forEach(({ id, name, type, icon }) => {
      // If coinbase injected connector is present, skip coinbase sdk connector.
      const isCoinbaseRepeated = coinbaseConnector && id === coinbaseSDKId
      const shouldSkip = isCoinbaseRepeated || ConstantsUtil.AUTH_CONNECTOR_ID === id
      if (!shouldSkip) {
        w3mConnectors.push({
          id,
          explorerId: PresetsUtil.ConnectorExplorerIds[id],
          imageUrl: this.options?.connectorImages?.[id] ?? icon,
          name: PresetsUtil.ConnectorNamesMap[id] ?? name,
          imageId: PresetsUtil.ConnectorImageIds[id],
          type: PresetsUtil.ConnectorTypesMap[type] ?? 'EXTERNAL',
          info: {
            rdns: id
          }
        })
      }
    })
    this.setConnectors(w3mConnectors)
    this.syncAuthConnector(filteredConnectors)
  }

  private async syncAuthConnector(
    connectors: Web3ModalClientOptions<Config>['wagmiConfig']['connectors']
  ) {
    const authConnector = connectors.find(
      ({ id }) => id === ConstantsUtil.AUTH_CONNECTOR_ID
    ) as unknown as Web3ModalClientOptions<Config>['wagmiConfig']['connectors'][0] & {
      email: boolean
      socials: SocialProvider[]
      showWallets?: boolean
    }
    if (authConnector) {
      const provider = await authConnector.getProvider()
      this.addConnector({
        id: ConstantsUtil.AUTH_CONNECTOR_ID,
        type: 'AUTH',
        name: 'Auth',
        provider,
        email: authConnector.email,
        socials: authConnector.socials,
        showWallets: authConnector?.showWallets === undefined ? true : authConnector.showWallets
      })
    }
  }

  private async initAuthConnectorListeners(
    connectors: Web3ModalClientOptions<Config>['wagmiConfig']['connectors']
  ) {
    const authConnector = connectors.find(({ id }) => id === ConstantsUtil.AUTH_CONNECTOR_ID)
    if (authConnector) {
      await this.listenAuthConnector(authConnector)
      await this.listenModal(authConnector)
    }
  }

  private async listenAuthConnector(
    connector: Web3ModalClientOptions<Config>['wagmiConfig']['connectors'][number]
  ) {
    if (typeof window !== 'undefined' && connector) {
      super.setLoading(true)
      const provider = (await connector.getProvider()) as W3mFrameProvider
      const isLoginEmailUsed = provider.getLoginEmailUsed()

      super.setLoading(isLoginEmailUsed)

      if (isLoginEmailUsed) {
        this.setIsConnected(false)
      }

      provider.onRpcRequest(request => {
        if (W3mFrameHelpers.checkIfRequestExists(request)) {
          if (!W3mFrameHelpers.checkIfRequestIsAllowed(request)) {
            if (super.isOpen()) {
              if (super.isTransactionStackEmpty()) {
                return
              }
              if (super.isTransactionShouldReplaceView()) {
                super.replace('ApproveTransaction')
              } else {
                super.redirect('ApproveTransaction')
              }
            } else {
              super.open({ view: 'ApproveTransaction' })
            }
          }
        } else {
          super.open()
          const method = W3mFrameHelpers.getRequestMethod(request)
          // eslint-disable-next-line no-console
          console.error(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_MESSAGE, { method })
          setTimeout(() => {
            this.showErrorMessage(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE)
          }, 300)
          provider.rejectRpcRequest()
        }
      })

      provider.onRpcResponse(response => {
        const responseType = W3mFrameHelpers.getResponseType(response)

        switch (responseType) {
          case W3mFrameConstants.RPC_RESPONSE_TYPE_ERROR: {
            const isModalOpen = super.isOpen()

            if (isModalOpen) {
              if (super.isTransactionStackEmpty()) {
                super.close()
              } else {
                super.popTransactionStack(true)
              }
            }
            break
          }
          case W3mFrameConstants.RPC_RESPONSE_TYPE_TX: {
            if (super.isTransactionStackEmpty()) {
              super.close()
            } else {
              super.popTransactionStack()
            }
            break
          }
          default:
            break
        }
      })

      provider.onNotConnected(() => {
        const isConnected = this.getIsConnectedState()
        if (!isConnected) {
          this.setIsConnected(false)
          super.setLoading(false)
        }
      })

      provider.onIsConnected(req => {
        this.setIsConnected(true)
        this.setSmartAccountDeployed(Boolean(req.smartAccountDeployed))
        this.setPreferredAccountType(req.preferredAccountType as W3mFrameTypes.AccountType)
        super.setLoading(false)
      })

      provider.onGetSmartAccountEnabledNetworks(networks => {
        this.setSmartAccountEnabledNetworks(networks)
      })

      provider.onSetPreferredAccount(({ address, type }) => {
        if (!address) {
          return
        }
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)
        this.syncAccount({
          address: address as `0x${string}`,
          chainId,
          isConnected: true,
          connector
        }).then(() => this.setPreferredAccountType(type as W3mFrameTypes.AccountType))
      })
    }
  }

  private async listenModal(
    connector: Web3ModalClientOptions<Config>['wagmiConfig']['connectors'][number]
  ) {
    const provider = (await connector.getProvider()) as W3mFrameProvider
    this.subscribeState(val => {
      if (!val.open) {
        provider.rejectRpcRequest()
      }
    })
  }
}
