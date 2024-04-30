// -- Types --------------------------------------------- //

import { NumberUtil } from '@web3modal/common'
import type { SwapTokenWithBalance } from './TypeUtil.js'

// -- Util ---------------------------------------- //
export const SwapCalculationUtil = {
  getGasPriceInEther(gas: bigint, gasPrice: bigint) {
    const totalGasCostInWei = gasPrice * gas
    const totalGasCostInEther = Number(totalGasCostInWei) / 1e18

    return totalGasCostInEther
  },

  getGasPriceInUSD(networkPrice: string, gas: bigint, gasPrice: bigint) {
    const totalGasCostInEther = SwapCalculationUtil.getGasPriceInEther(gas, gasPrice)
    const networkPriceInUSD = NumberUtil.bigNumber(networkPrice)
    const gasCostInUSD = networkPriceInUSD.multipliedBy(totalGasCostInEther)

    return gasCostInUSD.toNumber()
  },

  getPriceImpact({
    sourceTokenAmount,
    sourceTokenPriceInUSD,
    toTokenPriceInUSD,
    toTokenAmount,
    gasPriceInUSD
  }: {
    sourceTokenAmount: string
    sourceTokenPriceInUSD: number
    toTokenPriceInUSD: number
    toTokenAmount: string
    gasPriceInUSD: number
  }) {
    const totalCostInUSD = NumberUtil.bigNumber(sourceTokenAmount)
      .multipliedBy(sourceTokenPriceInUSD)
      .plus(gasPriceInUSD)
    const effectivePricePerToToken = totalCostInUSD.dividedBy(toTokenAmount)
    const priceImpact = effectivePricePerToToken
      .minus(toTokenPriceInUSD)
      .dividedBy(toTokenPriceInUSD)
      .multipliedBy(100)

    return priceImpact.toNumber()
  },

  getMaxSlippage(slippage: number, sourceTokenAmount: string) {
    const slippageToleranceDecimal = NumberUtil.bigNumber(slippage).dividedBy(100)
    const maxSlippageAmount = NumberUtil.multiply(sourceTokenAmount, slippageToleranceDecimal)

    return maxSlippageAmount.toNumber()
  },

  isInsufficientNetworkTokenForGas(networkBalanceInUSD: string, gasPriceInUSD: number | undefined) {
    const gasPrice = gasPriceInUSD || '0'

    if (NumberUtil.bigNumber(networkBalanceInUSD).isZero()) {
      return true
    }

    return NumberUtil.bigNumber(NumberUtil.bigNumber(gasPrice)).isGreaterThan(networkBalanceInUSD)
  },

  isInsufficientSourceTokenForSwap(
    sourceTokenAmount: string,
    sourceTokenAddress: string,
    balance: SwapTokenWithBalance[] | undefined
  ) {
    const sourceTokenBalance = balance?.find(token => token.address === sourceTokenAddress)
      ?.quantity?.numeric

    const isInSufficientBalance = NumberUtil.bigNumber(sourceTokenBalance || '0').isLessThan(
      sourceTokenAmount
    )

    return isInSufficientBalance
  },

  getToTokenAmount({
    sourceToken,
    toToken,
    sourceTokenPrice,
    toTokenPrice,
    sourceTokenAmount
  }: {
    sourceToken: SwapTokenWithBalance | undefined
    toToken: SwapTokenWithBalance | undefined
    sourceTokenPrice: number
    toTokenPrice: number
    sourceTokenAmount: string
  }) {
    if (!sourceToken || !toToken) {
      return '0'
    }

    const sourceTokenDecimals = sourceToken.decimals
    const sourceTokenPriceInUSD = sourceTokenPrice
    const toTokenDecimals = toToken.decimals
    const toTokenPriceInUSD = toTokenPrice

    if (toTokenPriceInUSD <= 0) {
      return '0'
    }

    const decimalDifference = sourceTokenDecimals - toTokenDecimals
    const sourceAmountInSmallestUnit = NumberUtil.bigNumber(sourceTokenAmount).multipliedBy(
      NumberUtil.bigNumber(10).pow(sourceTokenDecimals)
    )
    const priceRatio = NumberUtil.bigNumber(sourceTokenPriceInUSD).dividedBy(toTokenPriceInUSD)
    const toTokenAmountInSmallestUnit = sourceAmountInSmallestUnit
      .multipliedBy(priceRatio)
      .dividedBy(NumberUtil.bigNumber(10).pow(decimalDifference))

    const toTokenAmount = toTokenAmountInSmallestUnit.dividedBy(
      NumberUtil.bigNumber(10).pow(toTokenDecimals)
    )
    const amount = toTokenAmount.toFixed(toTokenDecimals).toString()

    return amount
  }
}
