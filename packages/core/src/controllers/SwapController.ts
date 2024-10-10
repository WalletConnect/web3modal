import { NumberUtil } from '@reown/appkit-common'
import { W3mFrameRpcConstants } from '@reown/appkit-wallet'
import { proxy, subscribe as sub } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { ConstantsUtil } from '../utils/ConstantsUtil.js'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { StorageUtil } from '../utils/StorageUtil.js'
import { SwapApiUtil } from '../utils/SwapApiUtil.js'
import { SwapCalculationUtil } from '../utils/SwapCalculationUtil.js'
import type { SwapTokenWithBalance } from '../utils/TypeUtil.js'
import { AccountController } from './AccountController.js'
import { BlockchainApiController } from './BlockchainApiController.js'
import { ChainController } from './ChainController.js'
import { ConnectionController } from './ConnectionController.js'
import { EventsController } from './EventsController.js'
import { OptionsController } from './OptionsController.js'
import { RouterController } from './RouterController.js'
import { SnackController } from './SnackController.js'

// -- Constants ---------------------------------------- //
export const INITIAL_GAS_LIMIT = 150000
export const TO_AMOUNT_DECIMALS = 6

// -- Types --------------------------------------------- //
export type SwapInputTarget = 'sourceToken' | 'toToken'

type TransactionParams = {
  data: string
  to: string
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

export interface SwapControllerState {
  // Loading states
  initializing: boolean
  initialized: boolean
  loadingPrices: boolean
  loadingQuote?: boolean
  loadingApprovalTransaction?: boolean
  loadingBuildTransaction?: boolean
  loadingTransaction?: boolean

  // Error states
  fetchError: boolean

  // Approval & Swap transaction states
  approvalTransaction: TransactionParams | undefined
  swapTransaction: TransactionParams | undefined
  transactionError?: string

  // Input values
  sourceToken?: SwapTokenWithBalance
  sourceTokenAmount: string
  sourceTokenPriceInUSD: number
  toToken?: SwapTokenWithBalance
  toTokenAmount: string
  toTokenPriceInUSD: number
  networkPrice: string
  networkBalanceInUSD: string
  networkTokenSymbol: string
  inputError: string | undefined

  // Request values
  slippage: number

  // Tokens
  tokens?: SwapTokenWithBalance[]
  suggestedTokens?: SwapTokenWithBalance[]
  popularTokens?: SwapTokenWithBalance[]
  foundTokens?: SwapTokenWithBalance[]
  myTokensWithBalance?: SwapTokenWithBalance[]
  tokensPriceMap: Record<string, number>

  // Calculations
  gasFee: string
  gasPriceInUSD?: number
  priceImpact: number | undefined
  maxSlippage: number | undefined
  providerFee: string | undefined
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

type StateKey = keyof SwapControllerState

// -- State --------------------------------------------- //
const initialState: SwapControllerState = {
  // Loading states
  initializing: false,
  initialized: false,
  loadingPrices: false,
  loadingQuote: false,
  loadingApprovalTransaction: false,
  loadingBuildTransaction: false,
  loadingTransaction: false,

  // Error states
  fetchError: false,

  // Approval & Swap transaction states
  approvalTransaction: undefined,
  swapTransaction: undefined,
  transactionError: undefined,

  // Input values
  sourceToken: undefined,
  sourceTokenAmount: '',
  sourceTokenPriceInUSD: 0,
  toToken: undefined,
  toTokenAmount: '',
  toTokenPriceInUSD: 0,
  networkPrice: '0',
  networkBalanceInUSD: '0',
  networkTokenSymbol: '',
  inputError: undefined,

  // Request values
  slippage: ConstantsUtil.CONVERT_SLIPPAGE_TOLERANCE,

  // Tokens
  tokens: undefined,
  popularTokens: undefined,
  suggestedTokens: undefined,
  foundTokens: undefined,
  myTokensWithBalance: undefined,
  tokensPriceMap: {},

  // Calculations
  gasFee: '0',
  gasPriceInUSD: 0,
  priceImpact: undefined,
  maxSlippage: undefined,
  providerFee: undefined
}

const state = proxy<SwapControllerState>(initialState)

// -- Controller ---------------------------------------- //
export const SwapController = {
  state,

  subscribe(callback: (newState: SwapControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: SwapControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  getParams() {
    const caipAddress = ChainController.state.activeCaipAddress
    const address = CoreHelperUtil.getPlainAddress(caipAddress)
    const networkAddress = ChainController.getActiveNetworkTokenAddress()
    const type = StorageUtil.getConnectedConnector()

    if (!address) {
      throw new Error('No address found to swap the tokens from.')
    }

    const invalidToToken = !state.toToken?.address || !state.toToken?.decimals
    const invalidSourceToken =
      !state.sourceToken?.address ||
      !state.sourceToken?.decimals ||
      !NumberUtil.bigNumber(state.sourceTokenAmount).isGreaterThan(0)
    const invalidSourceTokenAmount = !state.sourceTokenAmount

    return {
      networkAddress,
      fromAddress: address,
      fromCaipAddress: caipAddress,
      sourceTokenAddress: state.sourceToken?.address,
      toTokenAddress: state.toToken?.address,
      toTokenAmount: state.toTokenAmount,
      toTokenDecimals: state.toToken?.decimals,
      sourceTokenAmount: state.sourceTokenAmount,
      sourceTokenDecimals: state.sourceToken?.decimals,
      invalidToToken,
      invalidSourceToken,
      invalidSourceTokenAmount,
      availableToSwap:
        caipAddress && !invalidToToken && !invalidSourceToken && !invalidSourceTokenAmount,
      isAuthConnector: type === 'AUTH'
    }
  },

  setSourceToken(sourceToken: SwapTokenWithBalance | undefined) {
    if (!sourceToken) {
      state.sourceToken = sourceToken
      state.sourceTokenAmount = ''
      state.sourceTokenPriceInUSD = 0

      return
    }

    state.sourceToken = sourceToken
    this.setTokenPrice(sourceToken.address, 'sourceToken')
  },

  setSourceTokenAmount(amount: string) {
    state.sourceTokenAmount = amount
  },

  setToToken(toToken: SwapTokenWithBalance | undefined) {
    if (!toToken) {
      state.toToken = toToken
      state.toTokenAmount = ''
      state.toTokenPriceInUSD = 0

      return
    }

    state.toToken = toToken
    this.setTokenPrice(toToken.address, 'toToken')
  },

  setToTokenAmount(amount: string) {
    state.toTokenAmount = amount
      ? NumberUtil.formatNumberToLocalString(amount, TO_AMOUNT_DECIMALS)
      : ''
  },

  async setTokenPrice(address: string, target: SwapInputTarget) {
    const { availableToSwap } = this.getParams()
    let price = state.tokensPriceMap[address] || 0

    if (!price) {
      state.loadingPrices = true
      price = await this.getAddressPrice(address)
    }

    if (target === 'sourceToken') {
      state.sourceTokenPriceInUSD = price
    } else if (target === 'toToken') {
      state.toTokenPriceInUSD = price
    }

    if (state.loadingPrices) {
      state.loadingPrices = false
      if (availableToSwap) {
        this.swapTokens()
      }
    }
  },

  switchTokens() {
    if (state.initializing || !state.initialized) {
      return
    }

    const newSourceToken = state.toToken ? { ...state.toToken } : undefined
    const newToToken = state.sourceToken ? { ...state.sourceToken } : undefined
    const newSourceTokenAmount =
      newSourceToken && state.toTokenAmount === '' ? '1' : state.toTokenAmount

    this.setSourceToken(newSourceToken)
    this.setToToken(newToToken)

    this.setSourceTokenAmount(newSourceTokenAmount)
    this.setToTokenAmount('')
    this.swapTokens()
  },

  resetState() {
    state.myTokensWithBalance = initialState.myTokensWithBalance
    state.tokensPriceMap = initialState.tokensPriceMap
    state.initialized = initialState.initialized
    state.sourceToken = initialState.sourceToken
    state.sourceTokenAmount = initialState.sourceTokenAmount
    state.sourceTokenPriceInUSD = initialState.sourceTokenPriceInUSD
    state.toToken = initialState.toToken
    state.toTokenAmount = initialState.toTokenAmount
    state.toTokenPriceInUSD = initialState.toTokenPriceInUSD
    state.networkPrice = initialState.networkPrice
    state.networkTokenSymbol = initialState.networkTokenSymbol
    state.networkBalanceInUSD = initialState.networkBalanceInUSD
    state.inputError = initialState.inputError
  },

  resetValues() {
    const { networkAddress } = this.getParams()

    const networkToken = state.tokens?.find(token => token.address === networkAddress)
    this.setSourceToken(networkToken)
    this.setToToken(undefined)
  },

  getApprovalLoadingState() {
    return state.loadingApprovalTransaction
  },

  clearError() {
    state.transactionError = undefined
  },

  async initializeState() {
    if (state.initializing) {
      return
    }

    state.initializing = true
    if (!state.initialized) {
      try {
        await this.fetchTokens()
        state.initialized = true
      } catch (error) {
        state.initialized = false
        SnackController.showError('Failed to initialize swap')
        RouterController.goBack()
      }
    }
    state.initializing = false
  },

  async fetchTokens() {
    const { networkAddress } = this.getParams()

    await this.getTokenList()
    await this.getNetworkTokenPrice()
    await this.getMyTokensWithBalance()

    const networkToken = state.tokens?.find(token => token.address === networkAddress)

    if (networkToken) {
      state.networkTokenSymbol = networkToken.symbol
      this.setSourceToken(networkToken)
      this.setSourceTokenAmount('1')
    }
  },

  async getTokenList() {
    const tokens = await SwapApiUtil.getTokenList()

    state.tokens = tokens
    state.popularTokens = tokens.sort((aTokenInfo, bTokenInfo) => {
      if (aTokenInfo.symbol < bTokenInfo.symbol) {
        return -1
      }
      if (aTokenInfo.symbol > bTokenInfo.symbol) {
        return 1
      }

      return 0
    })
    state.suggestedTokens = tokens.filter(token => {
      if (ConstantsUtil.SWAP_SUGGESTED_TOKENS.includes(token.symbol)) {
        return true
      }

      return false
    }, {})
  },

  async getAddressPrice(address: string) {
    const existPrice = state.tokensPriceMap[address]

    if (existPrice) {
      return existPrice
    }

    const response = await BlockchainApiController.fetchTokenPrice({
      projectId: OptionsController.state.projectId,
      addresses: [address]
    })
    const fungibles = response.fungibles || []
    const allTokens = [...(state.tokens || []), ...(state.myTokensWithBalance || [])]
    const symbol = allTokens?.find(token => token.address === address)?.symbol
    const price = fungibles.find(p => p.symbol.toLowerCase() === symbol?.toLowerCase())?.price || 0
    const priceAsFloat = parseFloat(price.toString())

    state.tokensPriceMap[address] = priceAsFloat

    return priceAsFloat
  },

  async getNetworkTokenPrice() {
    const { networkAddress } = this.getParams()

    const response = await BlockchainApiController.fetchTokenPrice({
      projectId: OptionsController.state.projectId,
      addresses: [networkAddress]
    }).catch(() => {
      SnackController.showError('Failed to fetch network token price')

      return { fungibles: [] }
    })
    const token = response.fungibles?.[0]
    const price = token?.price.toString() || '0'
    state.tokensPriceMap[networkAddress] = parseFloat(price)
    state.networkTokenSymbol = token?.symbol || ''
    state.networkPrice = price
  },

  async getMyTokensWithBalance(forceUpdate?: string) {
    const balances = await SwapApiUtil.getMyTokensWithBalance(forceUpdate)

    if (!balances) {
      return
    }

    await this.getInitialGasPrice()
    this.setBalances(balances)
  },

  setBalances(balances: SwapTokenWithBalance[]) {
    const { networkAddress } = this.getParams()
    const caipNetwork = ChainController.state.activeCaipNetwork

    if (!caipNetwork) {
      return
    }

    const networkToken = balances.find(token => token.address === networkAddress)

    balances.forEach(token => {
      state.tokensPriceMap[token.address] = token.price || 0
    })
    state.myTokensWithBalance = balances.filter(token =>
      token.address.startsWith(caipNetwork.caipNetworkId)
    )
    state.networkBalanceInUSD = networkToken
      ? NumberUtil.multiply(networkToken.quantity.numeric, networkToken.price).toString()
      : '0'
  },

  async getInitialGasPrice() {
    const res = await SwapApiUtil.fetchGasPrice()

    if (!res) {
      return { gasPrice: null, gasPriceInUSD: null }
    }

    switch (ChainController.state?.activeCaipNetwork?.chainNamespace) {
      case 'solana':
        state.gasFee = res.standard
        state.gasPriceInUSD = NumberUtil.multiply(res.standard, state.networkPrice)
          .dividedBy(1e9)
          .toNumber()

        return {
          gasPrice: BigInt(state.gasFee),
          gasPriceInUSD: Number(state.gasPriceInUSD)
        }

      case 'eip155':
      default:
        // eslint-disable-next-line no-case-declarations
        const value = res.standard
        // eslint-disable-next-line no-case-declarations
        const gasFee = BigInt(value)
        // eslint-disable-next-line no-case-declarations
        const gasLimit = BigInt(INITIAL_GAS_LIMIT)
        // eslint-disable-next-line no-case-declarations
        const gasPrice = SwapCalculationUtil.getGasPriceInUSD(state.networkPrice, gasLimit, gasFee)

        state.gasFee = value
        state.gasPriceInUSD = gasPrice

        return { gasPrice: gasFee, gasPriceInUSD: gasPrice }
    }
  },

  // -- Swap -------------------------------------- //
  async swapTokens() {
    const address = AccountController.state.address as `${string}:${string}:${string}`
    const sourceToken = state.sourceToken
    const toToken = state.toToken
    const haveSourceTokenAmount = NumberUtil.bigNumber(state.sourceTokenAmount).isGreaterThan(0)

    if (!toToken || !sourceToken || state.loadingPrices || !haveSourceTokenAmount) {
      return
    }

    state.loadingQuote = true

    const amountDecimal = NumberUtil.bigNumber(state.sourceTokenAmount)
      .multipliedBy(10 ** sourceToken.decimals)
      .integerValue()

    const quoteResponse = await BlockchainApiController.fetchSwapQuote({
      userAddress: address,
      projectId: OptionsController.state.projectId,
      from: sourceToken.address,
      to: toToken.address,
      gasPrice: state.gasFee,
      amount: amountDecimal.toString()
    })

    state.loadingQuote = false

    const quoteToAmount = quoteResponse?.quotes?.[0]?.toAmount

    if (!quoteToAmount) {
      return
    }

    const toTokenAmount = NumberUtil.bigNumber(quoteToAmount)
      .dividedBy(10 ** toToken.decimals)
      .toString()

    this.setToTokenAmount(toTokenAmount)

    const isInsufficientToken = this.hasInsufficientToken(
      state.sourceTokenAmount,
      sourceToken.address
    )

    if (isInsufficientToken) {
      state.inputError = 'Insufficient balance'
    } else {
      state.inputError = undefined
      this.setTransactionDetails()
    }
  },

  // -- Create Transactions -------------------------------------- //
  async getTransaction() {
    const { fromCaipAddress, availableToSwap } = this.getParams()
    const sourceToken = state.sourceToken
    const toToken = state.toToken

    if (!fromCaipAddress || !availableToSwap || !sourceToken || !toToken || state.loadingQuote) {
      return undefined
    }

    try {
      state.loadingBuildTransaction = true
      const hasAllowance = await SwapApiUtil.fetchSwapAllowance({
        userAddress: fromCaipAddress,
        tokenAddress: sourceToken.address,
        sourceTokenAmount: state.sourceTokenAmount,
        sourceTokenDecimals: sourceToken.decimals
      })

      let transaction: TransactionParams | undefined = undefined

      if (hasAllowance) {
        transaction = await this.createSwapTransaction()
      } else {
        transaction = await this.createAllowanceTransaction()
      }

      state.loadingBuildTransaction = false
      state.fetchError = false

      return transaction
    } catch (error) {
      RouterController.goBack()
      SnackController.showError('Failed to check allowance')
      state.loadingBuildTransaction = false
      state.approvalTransaction = undefined
      state.swapTransaction = undefined
      state.fetchError = true

      return undefined
    }
  },

  async createAllowanceTransaction() {
    const { fromCaipAddress, fromAddress, sourceTokenAddress, toTokenAddress } = this.getParams()

    if (!fromCaipAddress || !toTokenAddress) {
      return undefined
    }

    if (!sourceTokenAddress) {
      throw new Error('createAllowanceTransaction - No source token address found.')
    }

    try {
      const response = await BlockchainApiController.generateApproveCalldata({
        projectId: OptionsController.state.projectId,
        from: sourceTokenAddress,
        to: toTokenAddress,
        userAddress: fromCaipAddress
      })
      const gasLimit = await ConnectionController.estimateGas({
        address: fromAddress as `0x${string}`,
        to: CoreHelperUtil.getPlainAddress(response.tx.to) as `0x${string}`,
        data: response.tx.data
      })

      const transaction = {
        data: response.tx.data,
        to: CoreHelperUtil.getPlainAddress(response.tx.from) as `0x${string}`,
        gas: gasLimit,
        gasPrice: BigInt(response.tx.eip155.gasPrice),
        value: BigInt(response.tx.value),
        toAmount: state.toTokenAmount
      }

      state.swapTransaction = undefined
      state.approvalTransaction = transaction

      return transaction
    } catch (error) {
      RouterController.goBack()
      SnackController.showError('Failed to create approval transaction')
      state.approvalTransaction = undefined
      state.swapTransaction = undefined
      state.fetchError = true

      return undefined
    }
  },

  async createSwapTransaction() {
    const { networkAddress, fromCaipAddress, sourceTokenAmount } = this.getParams()
    const sourceToken = state.sourceToken
    const toToken = state.toToken

    if (!fromCaipAddress || !sourceTokenAmount || !sourceToken || !toToken) {
      return undefined
    }

    const amount = ConnectionController.parseUnits(
      sourceTokenAmount,
      sourceToken.decimals
    ).toString()

    try {
      const response = await BlockchainApiController.generateSwapCalldata({
        projectId: OptionsController.state.projectId,
        userAddress: fromCaipAddress,
        from: sourceToken.address,
        to: toToken.address,
        amount
      })

      const isSourceTokenIsNetworkToken = sourceToken.address === networkAddress

      const gas = BigInt(response.tx.eip155.gas)
      const gasPrice = BigInt(response.tx.eip155.gasPrice)

      const transaction = {
        data: response.tx.data,
        to: CoreHelperUtil.getPlainAddress(response.tx.to) as `0x${string}`,
        gas,
        gasPrice,
        value: isSourceTokenIsNetworkToken ? BigInt(amount) : BigInt('0'),
        toAmount: state.toTokenAmount
      }

      state.gasPriceInUSD = SwapCalculationUtil.getGasPriceInUSD(state.networkPrice, gas, gasPrice)

      state.approvalTransaction = undefined
      state.swapTransaction = transaction

      return transaction
    } catch (error) {
      RouterController.goBack()
      SnackController.showError('Failed to create transaction')
      state.approvalTransaction = undefined
      state.swapTransaction = undefined
      state.fetchError = true

      return undefined
    }
  },

  // -- Send Transactions --------------------------------- //
  async sendTransactionForApproval(data: TransactionParams) {
    const { fromAddress, isAuthConnector } = this.getParams()

    state.loadingApprovalTransaction = true
    const approveLimitMessage = `Approve limit increase in your wallet`

    if (isAuthConnector) {
      RouterController.pushTransactionStack({
        view: null,
        goBack: true,
        onSuccess() {
          SnackController.showLoading(approveLimitMessage)
        }
      })
    } else {
      SnackController.showLoading(approveLimitMessage)
    }

    try {
      await ConnectionController.sendTransaction({
        address: fromAddress as `0x${string}`,
        to: data.to as `0x${string}`,
        data: data.data as `0x${string}`,
        value: BigInt(data.value),
        gasPrice: BigInt(data.gasPrice)
      })

      await this.swapTokens()
      await this.getTransaction()
      state.approvalTransaction = undefined
      state.loadingApprovalTransaction = false
    } catch (err) {
      const error = err as TransactionError
      state.transactionError = error?.shortMessage as unknown as string
      state.loadingApprovalTransaction = false
      SnackController.showError(error?.shortMessage || 'Transaction error')
    }
  },

  async sendTransactionForSwap(data: TransactionParams | undefined) {
    if (!data) {
      return undefined
    }

    const { fromAddress, toTokenAmount, isAuthConnector } = this.getParams()

    state.loadingTransaction = true

    const snackbarPendingMessage = `Swapping ${state.sourceToken
      ?.symbol} to ${NumberUtil.formatNumberToLocalString(toTokenAmount, 3)} ${state.toToken
      ?.symbol}`
    const snackbarSuccessMessage = `Swapped ${state.sourceToken
      ?.symbol} to ${NumberUtil.formatNumberToLocalString(toTokenAmount, 3)} ${state.toToken
      ?.symbol}`

    if (isAuthConnector) {
      RouterController.pushTransactionStack({
        view: 'Account',
        goBack: false,
        onSuccess() {
          SnackController.showLoading(snackbarPendingMessage)
          SwapController.resetState()
        }
      })
    } else {
      SnackController.showLoading('Confirm transaction in your wallet')
    }

    try {
      const forceUpdateAddresses = [state.sourceToken?.address, state.toToken?.address].join(',')
      const transactionHash = await ConnectionController.sendTransaction({
        address: fromAddress as `0x${string}`,
        to: data.to as `0x${string}`,
        data: data.data as `0x${string}`,
        gas: data.gas,
        gasPrice: BigInt(data.gasPrice),
        value: data.value
      })

      state.loadingTransaction = false
      SnackController.showSuccess(snackbarSuccessMessage)
      EventsController.sendEvent({
        type: 'track',
        event: 'SWAP_SUCCESS',
        properties: {
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || '',
          swapFromToken: this.state.sourceToken?.symbol || '',
          swapToToken: this.state.toToken?.symbol || '',
          swapFromAmount: this.state.sourceTokenAmount || '',
          swapToAmount: this.state.toTokenAmount || '',
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
        }
      })
      SwapController.resetState()
      if (!isAuthConnector) {
        RouterController.replace('Account')
      }
      SwapController.getMyTokensWithBalance(forceUpdateAddresses)

      return transactionHash
    } catch (err) {
      const error = err as TransactionError
      state.transactionError = error?.shortMessage
      state.loadingTransaction = false
      SnackController.showError(error?.shortMessage || 'Transaction error')
      EventsController.sendEvent({
        type: 'track',
        event: 'SWAP_ERROR',
        properties: {
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || '',
          swapFromToken: this.state.sourceToken?.symbol || '',
          swapToToken: this.state.toToken?.symbol || '',
          swapFromAmount: this.state.sourceTokenAmount || '',
          swapToAmount: this.state.toTokenAmount || '',
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
        }
      })

      return undefined
    }
  },

  // -- Checks -------------------------------------------- //
  hasInsufficientToken(sourceTokenAmount: string, sourceTokenAddress: string) {
    const isInsufficientSourceTokenForSwap = SwapCalculationUtil.isInsufficientSourceTokenForSwap(
      sourceTokenAmount,
      sourceTokenAddress,
      state.myTokensWithBalance
    )

    // Smart Accounts may pay gas in any ERC20 token
    if (
      AccountController.state.preferredAccountType ===
      W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
    ) {
      return true
    }

    const insufficientNetworkTokenForGas = SwapCalculationUtil.isInsufficientNetworkTokenForGas(
      state.networkBalanceInUSD,
      state.gasPriceInUSD
    )

    return insufficientNetworkTokenForGas || isInsufficientSourceTokenForSwap
  },

  // -- Calculations -------------------------------------- //
  setTransactionDetails() {
    const { toTokenAddress, toTokenDecimals } = this.getParams()

    if (!toTokenAddress || !toTokenDecimals) {
      return
    }

    state.gasPriceInUSD = SwapCalculationUtil.getGasPriceInUSD(
      state.networkPrice,
      BigInt(state.gasFee),
      BigInt(INITIAL_GAS_LIMIT)
    )
    state.priceImpact = SwapCalculationUtil.getPriceImpact({
      sourceTokenAmount: state.sourceTokenAmount,
      sourceTokenPriceInUSD: state.sourceTokenPriceInUSD,
      toTokenPriceInUSD: state.toTokenPriceInUSD,
      toTokenAmount: state.toTokenAmount
    })
    state.maxSlippage = SwapCalculationUtil.getMaxSlippage(state.slippage, state.toTokenAmount)
    state.providerFee = SwapCalculationUtil.getProviderFee(state.sourceTokenAmount)
  }
}
