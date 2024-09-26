import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ConstantsUtil, type CaipNetworkId, type ChainNamespace } from '@reown/appkit-common'
import { ChainController } from '../../src/controllers/ChainController.js'
import { type ConnectionControllerClient } from '../../src/controllers/ConnectionController.js'
import { type NetworkControllerClient } from '../../src/controllers/NetworkController.js'

// -- Setup --------------------------------------------------------------------
const chainNamespace = 'eip155' as ChainNamespace
const caipAddress = 'eip155:1:0x123'
const approvedCaipNetworkIds = ['eip155:1', 'eip155:4'] as CaipNetworkId[]

const connectionControllerClient: ConnectionControllerClient = {
  connectWalletConnect: async () => Promise.resolve(),
  disconnect: async () => Promise.resolve(),
  estimateGas: async () => Promise.resolve(BigInt(0)),
  signMessage: async (message: string) => Promise.resolve(message),
  parseUnits: value => BigInt(value),
  formatUnits: value => value.toString(),
  sendTransaction: () => Promise.resolve('0x'),
  writeContract: () => Promise.resolve('0x'),
  getEnsAddress: async (value: string) => Promise.resolve(value),
  getEnsAvatar: async (value: string) => Promise.resolve(value)
}

const networkControllerClient: NetworkControllerClient = {
  switchCaipNetwork: async _caipNetwork => Promise.resolve(),
  getApprovedCaipNetworksData: async () =>
    Promise.resolve({ approvedCaipNetworkIds: [], supportsAllNetworks: false })
}

const evmAdapter = {
  chainNamespace,
  connectionControllerClient,
  networkControllerClient,
  caipNetworks: []
}

beforeAll(() => {
  ChainController.initialize([evmAdapter])
})

// -- Tests --------------------------------------------------------------------
describe('ChainController', () => {
  it('should be initialized as expected', () => {
    expect(ChainController.state.activeChain).toEqual(ConstantsUtil.CHAIN.EVM)
    expect(ChainController.getConnectionControllerClient()).toEqual(connectionControllerClient)
    expect(ChainController.getNetworkControllerClient()).toEqual(networkControllerClient)
  })

  it('should update account state as expected', () => {
    ChainController.setAccountProp('caipAddress', caipAddress, chainNamespace)
    expect(ChainController.getAccountProp('caipAddress')).toEqual(caipAddress)
  })

  it('should update network state as expected', () => {
    ChainController.setAdapterNetworkState(ConstantsUtil.CHAIN.EVM, {
      approvedCaipNetworkIds
    })
    expect(
      ChainController.getNetworkProp('approvedCaipNetworkIds', ConstantsUtil.CHAIN.EVM)
    ).toEqual(approvedCaipNetworkIds)
  })

  it('should update state correctly on getApprovedCaipNetworkIds()', async () => {
    const namespace = 'eip155'
    const networkController = { ...networkControllerClient }
    const networkControllerSpy = vi
      .spyOn(networkController, 'getApprovedCaipNetworksData')
      .mockResolvedValue({
        approvedCaipNetworkIds,
        supportsAllNetworks: false
      })
    const evmAdapter = {
      chainNamespace,
      connectionControllerClient,
      networkControllerClient: networkController,
      caipNetworks: []
    }

    // Need to re-initialize to set the spy properly
    ChainController.initialize([evmAdapter])
    await ChainController.setApprovedCaipNetworksData(namespace)

    expect(ChainController.getApprovedCaipNetworkIds(namespace)).toEqual(approvedCaipNetworkIds)
    expect(networkControllerSpy).toHaveBeenCalled()
  })

  // it('should update state correctly on setRequestedCaipNetworks()', () => {
  //   ChainController.setRequestedCaipNetworks(requestedCaipNetworks, chain)
  //   expect(ChainController.state.requestedCaipNetworks).toEqual(requestedCaipNetworks)
  // })

  // it('should reset state correctly on resetNetwork()', () => {
  //   const namespace = 'eip155'
  //   ChainController.resetNetwork(namespace)
  //   const requestedCaipNetworks = ChainController.getRequestedCaipNetworkIds(namespace)
  //   const approvedCaipNetworkIds = ChainController.getApprovedCaipNetworkIds(namespace)
  //   const smartAccountEnabledNetworks = ChainController.getNetworkProp('smartAccountEnabledNetworks')
  //   expect(approvedCaipNetworkIds).toEqual(undefined)
  //   expect(requestedCaipNetworks).toEqual(requestedCaipNetworks)
  //   expect(smartAccountEnabledNetworks).toEqual([])
  // })

  it('should reset account as expected', () => {
    ChainController.resetAccount(ChainController.state.activeChain)
    expect(ChainController.getAccountProp('smartAccountDeployed')).toEqual(false)
    expect(ChainController.getAccountProp('currentTab')).toEqual(0)
    expect(ChainController.getAccountProp('caipAddress')).toEqual(undefined)
    expect(ChainController.getAccountProp('address')).toEqual(undefined)
    expect(ChainController.getAccountProp('balance')).toEqual(undefined)
    expect(ChainController.getAccountProp('balanceSymbol')).toEqual(undefined)
    expect(ChainController.getAccountProp('profileName')).toEqual(undefined)
    expect(ChainController.getAccountProp('profileImage')).toEqual(undefined)
    expect(ChainController.getAccountProp('addressExplorerUrl')).toEqual(undefined)
    expect(ChainController.getAccountProp('tokenBalance')).toEqual([])
    expect(ChainController.getAccountProp('connectedWalletInfo')).toEqual(undefined)
    expect(ChainController.getAccountProp('preferredAccountType')).toEqual(undefined)
    expect(ChainController.getAccountProp('socialProvider')).toEqual(undefined)
    expect(ChainController.getAccountProp('socialWindow')).toEqual(undefined)
  })
})
