import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy, subscribe as sub } from 'valtio/vanilla'
import {
  ONRAMP_PROVIDERS,
  MELD_DEV_PUBLIC_KEY,
  MELD_PROD_PUBLIC_KEY
} from '../utils/ConstantsUtil.js'
import type { PurchaseCurrency, PaymentCurrency } from '../utils/TypeUtil.js'
import { BlockchainApiController } from './BlockchainApiController.js'
import { ApiController } from './ApiController.js'
import { ChainController } from './ChainController.js'
import { AccountController } from './AccountController.js'
import { ConstantsUtil } from '@web3modal/common'

// -- Types --------------------------------------------- //
export type OnRampProviderOption = 'coinbase' | 'moonpay' | 'stripe' | 'paypal' | 'meld'

export type OnRampProvider = {
  label: string
  name: OnRampProviderOption
  feeRange: string
  url: string
  supportedChains: string[]
}

export interface OnRampControllerState {
  selectedProvider: OnRampProvider | null
  purchaseCurrency: PurchaseCurrency
  paymentCurrency: PaymentCurrency
  purchaseCurrencies: PurchaseCurrency[]
  paymentCurrencies: PaymentCurrency[]
  purchaseAmount?: number
  paymentAmount?: number
  providers: OnRampProvider[]
  error: string | null
  quotesLoading: boolean
}

type StateKey = keyof OnRampControllerState

export const USDC_CURRENCY_DEFAULT = {
  id: '2b92315d-eab7-5bef-84fa-089a131333f5',
  name: 'USD Coin',
  symbol: 'USDC',
  networks: [
    {
      name: 'ethereum-mainnet',
      display_name: 'Ethereum',
      chain_id: '1',
      contract_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    },
    {
      name: 'polygon-mainnet',
      display_name: 'Polygon',
      chain_id: '137',
      contract_address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    }
  ]
}

export const USD_CURRENCY_DEFAULT = {
  id: 'USD',
  payment_method_limits: [
    {
      id: 'card',
      min: '10.00',
      max: '7500.00'
    },
    {
      id: 'ach_bank_account',
      min: '10.00',
      max: '25000.00'
    }
  ]
}

const defaultState = {
  providers: ONRAMP_PROVIDERS as OnRampProvider[],
  selectedProvider: null,
  error: null,
  purchaseCurrency: USDC_CURRENCY_DEFAULT,
  paymentCurrency: USD_CURRENCY_DEFAULT,
  purchaseCurrencies: [USDC_CURRENCY_DEFAULT],
  paymentCurrencies: [],
  quotesLoading: false
}

// -- State --------------------------------------------- //
const state = proxy<OnRampControllerState>(defaultState)

// -- Controller ---------------------------------------- //
export const OnRampController = {
  state,

  subscribe(callback: (newState: OnRampControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: OnRampControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setSelectedProvider(provider: OnRampProvider | null) {
    if (provider && provider.name === 'meld') {
      const pubKey =
        process.env['NODE_ENV'] === 'production' ? MELD_PROD_PUBLIC_KEY : MELD_DEV_PUBLIC_KEY
      const currency =
        ChainController.state.activeChain === ConstantsUtil.CHAIN.SOLANA ? 'SOL' : 'USDC'
      const address = AccountController.state.address ?? ''
      const url = new URL(provider.url)
      url.searchParams.append('publicKey', pubKey)
      url.searchParams.append('destinationCurrencyCode', currency)
      url.searchParams.append('walletAddress', address)
      provider.url = url.toString()
    }
    state.selectedProvider = provider
  },

  setPurchaseCurrency(currency: PurchaseCurrency) {
    state.purchaseCurrency = currency
  },

  setPaymentCurrency(currency: PaymentCurrency) {
    state.paymentCurrency = currency
  },

  setPurchaseAmount(amount: number) {
    this.state.purchaseAmount = amount
  },

  setPaymentAmount(amount: number) {
    this.state.paymentAmount = amount
  },

  async getAvailableCurrencies() {
    const options = await BlockchainApiController.getOnrampOptions()
    state.purchaseCurrencies = options.purchaseCurrencies
    state.paymentCurrencies = options.paymentCurrencies
    state.paymentCurrency = options.paymentCurrencies[0] || USD_CURRENCY_DEFAULT
    state.purchaseCurrency = options.purchaseCurrencies[0] || USDC_CURRENCY_DEFAULT
    await ApiController.fetchCurrencyImages(options.paymentCurrencies.map(currency => currency.id))
    await ApiController.fetchTokenImages(
      options.purchaseCurrencies.map(currency => currency.symbol)
    )
  },

  async getQuote() {
    state.quotesLoading = true
    try {
      const quote = await BlockchainApiController.getOnrampQuote({
        purchaseCurrency: state.purchaseCurrency,
        paymentCurrency: state.paymentCurrency,
        amount: state.paymentAmount?.toString() || '0',
        network: state.purchaseCurrency?.symbol
      })
      state.quotesLoading = false
      state.purchaseAmount = Number(quote.purchaseAmount.amount)

      return quote
    } catch (error) {
      state.error = (error as Error).message
      state.quotesLoading = false

      return null
    } finally {
      state.quotesLoading = false
    }
  },

  resetState() {
    state.providers = ONRAMP_PROVIDERS as OnRampProvider[]
    state.selectedProvider = null
    state.error = null
    state.purchaseCurrency = USDC_CURRENCY_DEFAULT
    state.paymentCurrency = USD_CURRENCY_DEFAULT
    state.purchaseCurrencies = [USDC_CURRENCY_DEFAULT]
    state.paymentCurrencies = []
    state.paymentAmount = undefined
    state.purchaseAmount = undefined
    state.quotesLoading = false
  }
}
