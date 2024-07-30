import { ConnectionController } from '../controllers/ConnectionController.js'
import { ConstantsUtil } from './ConstantsUtil.js'
import { BlockchainApiController } from '../controllers/BlockchainApiController.js'
import type { SwapTokenWithBalance } from './TypeUtil.js'
import { OptionsController } from '../controllers/OptionsController.js'
import type { BlockchainApiSwapAllowanceRequest, BlockchainApiBalanceResponse } from './TypeUtil.js'
import { NetworkController } from '../controllers/NetworkController.js'
import { AccountController } from '../controllers/AccountController.js'

// -- Types --------------------------------------------- //
export type TokenInfo = {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  logoURI: string
  domainVersion?: string
  eip2612?: boolean
  isFoT?: boolean
  tags?: string[]
}

// -- Controller ---------------------------------------- //
export const SwapApiUtil = {
  async getTokenList() {
    const caipNetwork = NetworkController.state.caipNetwork
    const response = await BlockchainApiController.fetchSwapTokens({
      chainId: caipNetwork?.id,
      projectId: OptionsController.state.projectId
    })
    const tokens =
      response?.tokens?.map(
        token =>
          ({
            ...token,
            eip2612: false,
            quantity: {
              decimals: '0',
              numeric: '0'
            },
            price: 0,
            value: 0
          }) as SwapTokenWithBalance
      ) || []

    return tokens
  },

  async fetchGasPrice() {
    const projectId = OptionsController.state.projectId
    const caipNetwork = NetworkController.state.caipNetwork

    if (!caipNetwork) {
      return null
    }

    return await BlockchainApiController.fetchGasPrice({
      projectId,
      chainId: caipNetwork.id
    })
  },

  async fetchSwapAllowance({
    tokenAddress,
    userAddress,
    sourceTokenAmount,
    sourceTokenDecimals
  }: Pick<BlockchainApiSwapAllowanceRequest, 'tokenAddress' | 'userAddress'> & {
    sourceTokenAmount: string
    sourceTokenDecimals: number
  }) {
    const projectId = OptionsController.state.projectId

    const response = await BlockchainApiController.fetchSwapAllowance({
      projectId,
      tokenAddress,
      userAddress
    })

    if (response?.allowance && sourceTokenAmount && sourceTokenDecimals) {
      const parsedValue =
        ConnectionController.parseUnits(sourceTokenAmount, sourceTokenDecimals) || 0
      const hasAllowance = BigInt(response.allowance) >= parsedValue

      return hasAllowance
    }

    return false
  },

  async getMyTokensWithBalance(forceUpdate?: string) {
    const address = AccountController.state.address
    const caipNetwork = NetworkController.state.caipNetwork

    if (!address || !caipNetwork) {
      return []
    }

    const response = await BlockchainApiController.getBalance(address, caipNetwork.id, forceUpdate)
    const balances = response.balances.filter(balance => balance.quantity.decimals !== '0')

    AccountController.setTokenBalance(balances)

    return this.mapBalancesToSwapTokens(balances)
  },

  mapBalancesToSwapTokens(balances: BlockchainApiBalanceResponse['balances']) {
    return (
      balances?.map(
        token =>
          ({
            ...token,
            address: token?.address
              ? token.address
              : `${token.chainId}:${ConstantsUtil.NATIVE_TOKEN_ADDRESS}`,
            decimals: parseInt(token.quantity.decimals, 10),
            logoUri: token.iconUrl,
            eip2612: false
          }) as SwapTokenWithBalance
      ) || []
    )
  }
}
