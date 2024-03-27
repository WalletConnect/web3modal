import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { NetworkController } from './NetworkController.js'
import { FetchUtil } from '../utils/FetchUtil.js'
import { AccountController } from './AccountController.js'
import { ConnectionController } from './ConnectionController.js'

const ONEINCH_API_BASE_URL = 'https://1inch-swap-proxy.walletconnect-v1-bridge.workers.dev'
const CURRENT_CHAIN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const DEFAULT_SLIPPAGE_TOLERANCE = '0.5'

const OneInchAPIEndpoints = {
  approveTransaction: (chainId: number) => `/swap/v5.2/${chainId}/approve/transaction`,
  approveAllowance: (chainId: number) => `/swap/v5.2/${chainId}/approve/allowance`,
  gas: (chainId: number) => `/gas-price/v1.5/${chainId}`,
  gasPrice: (chainId: number) => `/gas-price/v1.5/${chainId}`,
  swap: (chainId: number) => `/swap/v5.2/${chainId}/swap`,
  tokens: (chainId: number) => `/swap/v5.2/${chainId}/tokens`,
  tokensCustom: (chainId: number) => `/token/v1.2/${chainId}/custom`,
  tokensPrices: (chainId: number) => `/price/v1.1/${chainId}`,
  search: (chainId: number) => `/token/v1.2/${chainId}/search`,
  balance: (chainId: number, address: string | undefined) =>
    `/balance/v1.2/${chainId}/balances/${address}`,
  quote: (chainId: number) => `/swap/v6.0/${chainId}/quote`
}

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

export interface TokenInfoWithPrice extends TokenInfo {
  price: string
}

export interface TokenInfoWithBalance extends TokenInfo {
  balance: string
  price: string
}

export type SwapApprovalData = {
  data: `0x${string}`
  to: `0x${string}`
  gasPrice: string
  value: string
}

export type TokenList = {
  tokens: Record<string, TokenInfo>
}

export type GetAllowanceParams = {
  fromAddress: string
  sourceTokenAddress: string
  sourceTokenAmount: string
  sourceTokenDecimals: number
}

export type GetApprovalParams = {
  sourceTokenAddress: string
  sourceTokenAmount?: string
}

export type GetConvertDataParams = {
  sourceTokenAddress: string
  toTokenAddress: string
  sourceTokenAmount: string
  fromAddress: string
  decimals: number
}

export type TransactionData = {
  from: string
  to: `0x${string}`
  data: `0x${string}`
  value: string
  gas: bigint
  gasPrice: string
}

export type GetConvertDataResponse = {
  toAmount: string
  tx: TransactionData
}

export type GetGasPricesResponse = {
  baseFree: string
  low: {
    maxPriorityFeePerGas: string
    maxFeePerGas: string
  }
  medium: {
    maxPriorityFeePerGas: string
    maxFeePerGas: string
  }
  high: {
    maxPriorityFeePerGas: string
    maxFeePerGas: string
  }
  instant: {
    maxPriorityFeePerGas: string
    maxFeePerGas: string
  }
}

// -- Controller ---------------------------------------- //
export const ConvertApiController = {
  get1InchAPI() {
    const api = new FetchUtil({ baseUrl: ONEINCH_API_BASE_URL })
    const chainId = CoreHelperUtil.getEvmChainId(NetworkController.state.caipNetwork?.id)
    const { address } = AccountController.state

    return {
      api,
      paths: {
        approveTransaction: OneInchAPIEndpoints.approveTransaction(chainId),
        approveAllowance: OneInchAPIEndpoints.approveAllowance(chainId),
        gas: OneInchAPIEndpoints.gasPrice(chainId),
        gasPrice: OneInchAPIEndpoints.gasPrice(chainId),
        swap: OneInchAPIEndpoints.swap(chainId),
        tokens: OneInchAPIEndpoints.tokens(chainId),
        tokensCustom: OneInchAPIEndpoints.tokensCustom(chainId),
        tokenPrices: OneInchAPIEndpoints.tokensPrices(chainId),
        search: OneInchAPIEndpoints.search(chainId),
        balance: OneInchAPIEndpoints.balance(chainId, address),
        quote: OneInchAPIEndpoints.quote(chainId)
      }
    }
  },

  _getSwapParams() {
    const { address } = AccountController.state
    if (!address) {
      throw new Error('No address found to swap the tokens from.')
    }

    return {
      fromAddress: address as `0x${string}`,
      slippage: DEFAULT_SLIPPAGE_TOLERANCE
    }
  },

  // /gas-price/v1.5/${chainId}
  async getGasPrice() {
    const { api, paths } = this.get1InchAPI()

    const gasPrices = await api.get<GetGasPricesResponse>({
      path: paths.gasPrice,
      headers: { 'content-type': 'application/json' }
    })

    return gasPrices
  },

  // - /swap/v5.2/${chainId}/approve/allowance
  async checkConvertAllowance({
    fromAddress,
    sourceTokenAddress,
    sourceTokenAmount,
    sourceTokenDecimals
  }: GetAllowanceParams) {
    const { api, paths } = this.get1InchAPI()

    const res = await api.get<{ allowance: string }>({
      path: paths.approveAllowance,
      params: { tokenAddress: sourceTokenAddress, walletAddress: fromAddress }
    })

    if (res?.allowance && sourceTokenAmount && sourceTokenDecimals) {
      const parsedValue = ConnectionController.parseUnits(sourceTokenAmount, sourceTokenDecimals)
      const hasAllowance = BigInt(res.allowance) >= parsedValue

      return hasAllowance
    }

    return false
  },

  // - /swap/v5.2/${chainId}/tokens
  async getTokenList() {
    const { api, paths } = this.get1InchAPI()

    return await api.get<TokenList>({ path: paths.tokens })
  },

  // - /token/v1.2/${chainId}/search
  async searchTokens(searchTerm: string) {
    const { api, paths } = this.get1InchAPI()

    return await api.get<TokenInfo[]>({
      path: paths.search,
      params: { query: searchTerm }
    })
  },

  async getMyTokensWithBalance() {
    const { balances, tokenAddresses } = await this.getBalances()

    if (!tokenAddresses?.length) {
      return undefined
    }

    const addresses = [...tokenAddresses, CURRENT_CHAIN_ADDRESS]

    const [tokenInfos, tokensPrices] = await Promise.all([
      this.getTokenInfoWithAddresses(addresses),
      this.getTokenPriceWithAddresses(addresses)
    ])

    const mergedTokensWithBalances = this.mergeTokensWithBalanceAndPrice(
      tokenInfos,
      balances,
      tokensPrices
    )

    return mergedTokensWithBalances
  },

  // - /balance/v1.2/${chainId}/balances/${address}
  async getBalances() {
    const { api, paths } = this.get1InchAPI()

    const balances = await api.get<Record<string, string>>({
      path: paths.balance
    })

    const nonEmptyBalances = Object.entries(balances).reduce<Record<string, string>>(
      (filteredBalances, [tokenAddress, balance]) => {
        if (balance !== '0') {
          filteredBalances[tokenAddress] = balance
        }

        return filteredBalances
      },
      {}
    )

    return { balances: nonEmptyBalances, tokenAddresses: Object.keys(nonEmptyBalances) }
  },

  // - /token/v1.2/${chainId}/custom
  async getTokenInfoWithAddresses(addresses: string[]) {
    const { api, paths } = this.get1InchAPI()

    return api.get<Record<string, TokenInfo>>({
      path: paths.tokensCustom,
      params: { addresses: addresses.join(',') }
    })
  },

  // - /price/v1.1/${chainId}
  async getTokenPriceWithAddresses(addresses: string[]) {
    const { api, paths } = this.get1InchAPI()

    return await api.post<Record<string, string>>({
      path: paths.tokenPrices,
      body: { tokens: addresses, currency: 'USD' },
      headers: {
        'content-type': 'application/json'
      }
    })
  },

  mergeTokensWithBalanceAndPrice(
    tokens: Record<string, TokenInfo>,
    balances: Record<string, string>,
    tokensPrice: Record<string, string>
  ) {
    const mergedTokens = Object.entries(tokens).reduce<Record<string, TokenInfoWithBalance>>(
      (_mergedTokens, [tokenAddress, tokenInfo]) => {
        _mergedTokens[tokenAddress] = {
          ...tokenInfo,
          balance: ConnectionController.formatUnits(
            BigInt(balances[tokenAddress] ?? '0'),
            tokenInfo.decimals
          ),
          price: tokensPrice[tokenAddress] ?? '0'
        }

        return _mergedTokens
      },
      {}
    )

    return mergedTokens
  },

  // --- /swap/v5.2/${chainId}/swap
  async getConvertData({
    sourceTokenAddress,
    toTokenAddress,
    sourceTokenAmount,
    fromAddress,
    decimals = 9
  }: GetConvertDataParams): Promise<GetConvertDataResponse> {
    const { api, paths } = this.get1InchAPI()

    return await api.get({
      path: paths.swap,
      params: {
        src: sourceTokenAddress,
        dst: toTokenAddress,
        slippage: DEFAULT_SLIPPAGE_TOLERANCE,
        from: fromAddress,
        amount: ConnectionController.parseUnits(sourceTokenAmount, decimals).toString()
      }
    })
  },

  // --- /swap/v5.2/${chainId}/approve/transaction
  async getConvertApprovalData({ sourceTokenAddress }: GetApprovalParams) {
    const { api, paths } = this.get1InchAPI()

    return await api.get<SwapApprovalData>({
      path: paths.approveTransaction,
      params: {
        tokenAddress: sourceTokenAddress
      }
    })
  }
}
