import { subscribeKey as subKey } from 'valtio/utils'
import { proxy, subscribe as sub } from 'valtio/vanilla'
import { AccountController } from './AccountController.js'
import { ConstantsUtil } from '../utils/ConstantsUtil.js'
import { ConnectionController } from './ConnectionController.js'
import { ConvertApiController } from './ConvertApiController.js'
import { SnackController } from './SnackController.js'
import { RouterController } from './RouterController.js'
import { NumberUtil } from '@web3modal/common'

const CURRENT_CHAIN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const DEFAULT_SLIPPAGE_TOLERANCE = '0.5'
const INITIAL_GAS_LIMIT = 150000

// -- Types --------------------------------------------- //
type TransactionParams = {
  data: `0x${string}`
  to: `0x${string}`
  gas: bigint
  gasPrice: bigint
  value: bigint
  toAmount: string
}

class TransactionError extends Error {
  shortMessage?: string

  constructor(message?: string, shortMessage?: string) {
    super(message)
    this.name = 'TransactionError'
    this.shortMessage = shortMessage
  }
}

export interface ConvertControllerState {
  // Loading states
  initialized: boolean
  loadingPrices: boolean
  loading?: boolean

  // Approval & Convert transaction states
  approvalTransaction: TransactionParams | undefined
  convertTransaction: TransactionParams | undefined
  transactionLoading?: boolean
  transactionError?: string

  // Input values
  sourceToken?: TokenInfo
  sourceTokenAmount: string
  sourceTokenPriceInUSD: number
  toToken?: TokenInfo
  toTokenAmount: string
  toTokenPriceInUSD: number
  networkPrice: string
  networkAddress: string | undefined
  inputError: string | undefined

  // Request values
  slippage: string

  // Tokens
  tokens?: Record<string, TokenInfo>
  suggestedTokens?: Record<string, TokenInfo>
  popularTokens?: Record<string, TokenInfo>
  foundTokens?: TokenInfo[]
  myTokensWithBalance?: Record<string, TokenInfoWithBalance>
  tokensPriceMap: Record<string, string>

  // Calculations
  gasFee: bigint
  gasPriceInUSD?: number
  priceImpact: number | undefined
  maxSlippage: number | undefined
}

export interface TokenInfo {
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

type StateKey = keyof ConvertControllerState

// -- State --------------------------------------------- //
const state = proxy<ConvertControllerState>({
  // Loading states
  initialized: false,
  loading: false,
  loadingPrices: false,

  // Approval & Convert transaction states
  approvalTransaction: undefined,
  convertTransaction: undefined,
  transactionError: undefined,
  transactionLoading: false,

  // Input values
  sourceToken: undefined,
  sourceTokenAmount: '',
  sourceTokenPriceInUSD: 0,
  toToken: undefined,
  toTokenAmount: '',
  toTokenPriceInUSD: 0,
  networkPrice: '0',
  networkAddress: CURRENT_CHAIN_ADDRESS,
  inputError: undefined,

  // Request values
  slippage: DEFAULT_SLIPPAGE_TOLERANCE,

  // Tokens
  tokens: undefined,
  popularTokens: undefined,
  suggestedTokens: undefined,
  foundTokens: undefined,
  myTokensWithBalance: undefined,
  tokensPriceMap: {},

  // Calculations
  gasFee: BigInt(0),
  gasPriceInUSD: 0,
  priceImpact: undefined,
  maxSlippage: undefined
})

// -- Controller ---------------------------------------- //
export const ConvertController = {
  state,

  subscribe(callback: (newState: ConvertControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: ConvertControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  getParams() {
    const { address } = AccountController.state

    if (!address) {
      throw new Error('No address found to swap the tokens from.')
    }

    return {
      fromAddress: address as `0x${string}`,
      sourceTokenAddress: state.sourceToken?.address,
      toTokenAddress: state.toToken?.address,
      toTokenAmount: state.toTokenAmount,
      toTokenDecimals: state.toToken?.decimals,
      sourceTokenAmount: state.sourceTokenAmount,
      sourceTokenDecimals: state.sourceToken?.decimals
    }
  },

  setSourceToken(sourceToken: TokenInfo | undefined) {
    if (!sourceToken) {
      return
    }

    state.sourceToken = sourceToken
    this.setTokenValues(sourceToken.address, state.sourceTokenAmount, 'sourceToken')
  },

  setSourceTokenAmount(amount: string) {
    const { sourceTokenAddress } = this.getParams()

    state.sourceTokenAmount = amount

    if (sourceTokenAddress) {
      this.setTokenValues(sourceTokenAddress, amount, 'sourceToken')
    }
  },

  setToToken(toToken: TokenInfo | undefined) {
    const { sourceTokenAddress, sourceTokenAmount } = this.getParams()

    if (!toToken) {
      return
    }

    state.toToken = toToken
    this.setTokenValues(toToken.address, state.toTokenAmount, 'toToken')

    if (sourceTokenAddress && sourceTokenAmount) {
      this.makeChecks()
    }
  },

  setToTokenAmount(amount: string) {
    const { toTokenAddress } = this.getParams()

    state.toTokenAmount = amount

    if (toTokenAddress) {
      this.setTokenValues(toTokenAddress, amount, 'toToken')
    }
  },

  async setTokenValues(address: string, amount: string, target: 'sourceToken' | 'toToken') {
    const balance = state.myTokensWithBalance?.[address]?.balance || '0'
    const price = await this.getAddressPrice(address)

    const balancePriceInUSD = NumberUtil.multiply(balance, price)
    const amountPriceInUSD = NumberUtil.multiply(amount, price)
    const insufficientBalance = amountPriceInUSD?.isGreaterThan(balancePriceInUSD)

    if (target === 'sourceToken') {
      state.sourceTokenPriceInUSD = price
    } else if (target === 'toToken') {
      state.toTokenPriceInUSD = price
    }

    state.inputError = insufficientBalance ? 'Insufficient balance' : undefined
    if (insufficientBalance) {
      state.toTokenAmount = '0'
      state.toTokenPriceInUSD = 0
    }
  },

  switchTokens() {
    const newSourceToken = state.toToken ? { ...state.toToken } : undefined
    const newToToken = state.sourceToken ? { ...state.sourceToken } : undefined

    this.setSourceToken(newSourceToken)
    this.setToToken(newToToken)

    this.setSourceTokenAmount(state.toTokenAmount)
    ConvertController.convertTokens()
  },

  resetTokens() {
    state.tokens = undefined
    state.popularTokens = undefined
    state.initialized = false
  },

  resetValues() {
    state.sourceToken = undefined
    state.myTokensWithBalance = undefined
    state.toToken = undefined
    state.sourceTokenAmount = '0'
    state.toTokenAmount = '0'
    state.sourceTokenPriceInUSD = 0
    state.toTokenPriceInUSD = 0
    state.gasPriceInUSD = 0
  },

  clearError() {
    state.transactionError = undefined
  },

  async initializeState() {
    if (!state.initialized) {
      await this.getTokenList()
      await this.getNetworkTokenPrice()
      await this.getMyTokensWithBalance()
      state.initialized = true
    }
  },

  async getTokenList() {
    const res = await ConvertApiController.getTokenList()

    state.tokens = res.tokens
    state.popularTokens = Object.entries(res.tokens)
      .sort(([, aTokenInfo], [, bTokenInfo]) => {
        if (aTokenInfo.symbol < bTokenInfo.symbol) {
          return -1
        }
        if (aTokenInfo.symbol > bTokenInfo.symbol) {
          return 1
        }

        return 0
      })
      .reduce<Record<string, TokenInfo>>((limitedTokens, [tokenAddress, tokenInfo]) => {
        if (ConstantsUtil.POPULAR_TOKENS.includes(tokenInfo.symbol)) {
          limitedTokens[tokenAddress] = tokenInfo
        }

        return limitedTokens
      }, {})
    state.suggestedTokens = Object.entries(res.tokens).reduce<Record<string, TokenInfo>>(
      (limitedTokens, [tokenAddress, tokenInfo]) => {
        if (ConstantsUtil.POPULAR_TOKENS.includes(tokenInfo.symbol)) {
          limitedTokens[tokenAddress] = tokenInfo
        }

        return limitedTokens
      },
      {}
    )

    return state.tokens
  },

  async getAddressPrice(address: string) {
    const existPrice = state.tokensPriceMap[address]
    if (existPrice) {
      return parseFloat(existPrice)
    }
    const prices = await ConvertApiController.getTokenPriceWithAddresses([address])
    const price = prices[address] || '0'
    state.tokensPriceMap[address] = price

    return parseFloat(price)
  },

  async setTokenPriceToMap(address: string, target: 'sourceToken' | 'toToken') {
    const prices = await ConvertApiController.getTokenPriceWithAddresses([address])
    const price = prices[address] || '0'
    state.tokensPriceMap[address] = price

    if (target === 'sourceToken') {
      state.sourceTokenPriceInUSD = parseFloat(price)
    } else if (target === 'toToken') {
      state.toTokenPriceInUSD = parseFloat(price)
    }

    if (address === CURRENT_CHAIN_ADDRESS) {
      state.networkPrice = price
    }

    return price
  },

  async getNetworkTokenPrice() {
    const prices = await ConvertApiController.getTokenPriceWithAddresses([CURRENT_CHAIN_ADDRESS])
    const price = prices[CURRENT_CHAIN_ADDRESS] || '0'
    state.tokensPriceMap[CURRENT_CHAIN_ADDRESS] = price
    state.networkPrice = price
  },

  async getMyTokensWithBalance() {
    const res = await ConvertApiController.getMyTokensWithBalance()

    if (!res) {
      return
    }

    await this.getInitialGasPrice()

    state.tokensPriceMap = Object.entries(res).reduce<Record<string, string>>(
      (prices, [tokenAddress, tokenInfo]) => {
        prices[tokenAddress] = tokenInfo.price

        return prices
      },
      {}
    )
    state.myTokensWithBalance = res
  },

  async getInitialGasPrice() {
    const res = await ConvertApiController.getGasPrice()
    const gasFee = BigInt(res.instant.maxFeePerGas)
    const gasLimit = BigInt(INITIAL_GAS_LIMIT)
    const gasPrice = this.calculateGasPriceInUSD(gasLimit, gasFee)
    state.gasPriceInUSD = gasPrice
  },

  async refreshConvertValues() {
    const { fromAddress, toTokenDecimals, toTokenAddress } = this.getParams()

    if (fromAddress && toTokenAddress && toTokenDecimals && !state.loading) {
      const transaction = await this.getTransaction()
      this.setTransactionDetails(transaction)
    }
  },

  calculateGasPriceInEther(gas: bigint, gasPrice: bigint) {
    const totalGasCostInWei = gasPrice * gas
    const totalGasCostInEther = Number(totalGasCostInWei) / 1e18

    return totalGasCostInEther
  },

  calculateGasPriceInUSD(gas: bigint, gasPrice: bigint) {
    try {
      const totalGasCostInEther = this.calculateGasPriceInEther(gas, gasPrice)
      const networkPriceNumber = NumberUtil.bigNumber(state.networkPrice)
      const totalCostInUSD = networkPriceNumber.multipliedBy(totalGasCostInEther)

      return totalCostInUSD.toNumber()
    } catch (error) {
      return 0
    }
  },

  calculatePriceImpact(_toTokenAmount: string, _gasPriceInUSD = 0) {
    const { toTokenDecimals } = this.getParams()
    const decimals = toTokenDecimals || 18

    const toTokenAmount = NumberUtil.bigNumber(_toTokenAmount).dividedBy(10 ** decimals)

    const totalSourceCostUSD = NumberUtil.bigNumber(state.sourceTokenAmount).multipliedBy(
      state.sourceTokenPriceInUSD
    )
    const adjustedTotalSourceCostUSD = totalSourceCostUSD.plus(_gasPriceInUSD)
    const effectivePricePerTargetToken = adjustedTotalSourceCostUSD.dividedBy(
      toTokenAmount.toString()
    )

    const priceImpact = effectivePricePerTargetToken
      .minus(state.toTokenPriceInUSD)
      .dividedBy(state.toTokenPriceInUSD)
      .multipliedBy(100)

    return priceImpact.toNumber()
  },

  calculateMaxSlippage() {
    const slippageToleranceDecimal = NumberUtil.bigNumber(state.slippage).dividedBy(100)
    const maxSlippageAmount = NumberUtil.multiply(state.sourceTokenAmount, slippageToleranceDecimal)

    return maxSlippageAmount.toNumber()
  },

  async convertTokens() {
    const { sourceTokenAddress, toTokenAddress } = this.getParams()

    if (!sourceTokenAddress || !toTokenAddress) {
      return
    }

    await this.makeChecks()
  },

  async makeChecks() {
    const { toTokenDecimals, toTokenAddress } = this.getParams()

    if (!toTokenDecimals || !toTokenAddress) {
      return
    }

    state.loading = true
    const transaction = await this.getTransaction()
    this.setTransactionDetails(transaction)
    state.loading = false
  },

  async getTransaction() {
    const { fromAddress, sourceTokenAddress, sourceTokenAmount, sourceTokenDecimals } =
      this.getParams()

    if (
      !sourceTokenAddress ||
      !sourceTokenAmount ||
      parseFloat(sourceTokenAmount) === 0 ||
      !sourceTokenDecimals
    ) {
      return null
    }

    const hasAllowance = await ConvertApiController.checkConvertAllowance({
      fromAddress,
      sourceTokenAddress,
      sourceTokenAmount,
      sourceTokenDecimals
    })

    let transaction: TransactionParams | null = null

    if (hasAllowance) {
      state.approvalTransaction = undefined
      transaction = await this.createConvert()
      state.convertTransaction = transaction || undefined
    } else {
      state.convertTransaction = undefined
      transaction = await this.createTokenAllowance()
      state.approvalTransaction = transaction
    }

    return transaction
  },

  getToAmount() {
    const toTokenConvertedAmount =
      state.sourceTokenPriceInUSD && state.toTokenPriceInUSD
        ? NumberUtil.bigNumber(1)
            .dividedBy(state.toTokenPriceInUSD)
            .multipliedBy(state.sourceTokenPriceInUSD)
        : NumberUtil.bigNumber(0)
    const scaleFactor = 10000000000
    const scaledNumber = toTokenConvertedAmount.multipliedBy(scaleFactor)

    return scaledNumber.toFixed(20)
  },

  async createTokenAllowance() {
    const { fromAddress, sourceTokenAddress } = this.getParams()

    if (!sourceTokenAddress) {
      throw new Error('>>> createTokenAllowance - No source token address found.')
    }

    const transaction = await ConvertApiController.getConvertApprovalData({
      sourceTokenAddress
    })

    const gasLimit = await ConnectionController.getEstimatedGas({
      address: fromAddress,
      to: transaction.to,
      data: transaction.data
    })

    const toAmount = this.getToAmount()

    return {
      ...transaction,
      gas: gasLimit,
      gasPrice: BigInt(transaction.gasPrice),
      value: BigInt(transaction.value),
      toAmount
    }
  },

  async sendTransactionForApproval(data: TransactionParams) {
    const { fromAddress } = this.getParams()
    state.transactionLoading = true

    try {
      await ConnectionController.sendTransaction({
        address: fromAddress,
        to: data.to,
        data: data.data,
        value: BigInt(data.value),
        gasPrice: BigInt(data.gasPrice)
      })

      state.approvalTransaction = undefined
      state.transactionLoading = false
    } catch (err) {
      const error = err as TransactionError
      state.transactionError = error?.shortMessage as unknown as string
      state.transactionLoading = false
      SnackController.showError(error?.shortMessage || 'Transaction error')
    }
  },

  async createConvert() {
    const {
      fromAddress,
      sourceTokenAddress,
      sourceTokenDecimals,
      sourceTokenAmount,
      toTokenAddress
    } = this.getParams()

    if (!sourceTokenAmount || !sourceTokenAddress || !toTokenAddress || !sourceTokenDecimals) {
      throw new Error('>>> createConvert: Invalid values to start converting')
    }

    try {
      const response = await ConvertApiController.getConvertData({
        fromAddress,
        sourceTokenAddress,
        sourceTokenAmount,
        toTokenAddress,
        decimals: sourceTokenDecimals
      })

      const transaction = {
        data: response.tx.data,
        to: response.tx.to,
        gas: BigInt(response.tx.gas),
        gasPrice: BigInt(response.tx.gasPrice),
        value: BigInt(response.tx.value),
        toAmount: response.toAmount
      }

      state.gasPriceInUSD = this.calculateGasPriceInUSD(
        BigInt(response.tx.gas),
        transaction.gasPrice
      )

      return transaction
    } catch (error) {
      return null
    }
  },

  async sendTransactionForConvert(data: TransactionParams | undefined) {
    if (!data) {
      return undefined
    }

    const { fromAddress } = this.getParams()

    state.transactionLoading = true
    try {
      const transactionHash = await ConnectionController.sendTransaction({
        address: fromAddress,
        to: data.to,
        data: data.data,
        gas: data.gas,
        gasPrice: BigInt(data.gasPrice),
        value: BigInt(data.value)
      })
      state.transactionLoading = false
      RouterController.replace('Transactions')
      setTimeout(() => {
        this.resetValues()
      }, 1000)

      return transactionHash
    } catch (err) {
      const error = err as TransactionError
      state.transactionError = error?.shortMessage
      state.transactionLoading = false
      SnackController.showError(error?.shortMessage || 'Transaction error')

      return undefined
    }
  },

  setToTokenAmountValue(toTokenAmount: string, toTokenAddress: string) {
    if (!toTokenAddress || !toTokenAmount) {
      return
    }

    const sourceTokenAmount = NumberUtil.bigNumber(state.sourceTokenAmount)
    const sourceTokenPrice = state.sourceTokenPriceInUSD
    const toTokenPrice = NumberUtil.bigNumber(state.tokensPriceMap[toTokenAddress] || '0')
    const toTokenAmountValue = sourceTokenAmount
      .multipliedBy(sourceTokenPrice)
      .dividedBy(toTokenPrice)

    state.toTokenAmount = NumberUtil.bigNumber(toTokenAmount).toFixed(20)
    state.toTokenPriceInUSD = toTokenPrice.toNumber()
    state.toTokenAmount = toTokenAmountValue.toFixed(20)
  },

  setTransactionDetails(transaction: TransactionParams | null) {
    const { toTokenAddress, toTokenDecimals } = this.getParams()

    if (!transaction || !toTokenAddress || !toTokenDecimals) {
      return
    }

    this.setToTokenAmountValue(transaction.toAmount, toTokenAddress)

    const toTokenPrice = state.tokensPriceMap[toTokenAddress] || '0'
    state.toTokenPriceInUSD = NumberUtil.bigNumber(toTokenPrice).toNumber()
    state.gasPriceInUSD = this.calculateGasPriceInUSD(transaction.gas, transaction.gasPrice)
    state.priceImpact = this.calculatePriceImpact(transaction.toAmount, state.gasPriceInUSD)
    state.maxSlippage = this.calculateMaxSlippage()
  }
}
