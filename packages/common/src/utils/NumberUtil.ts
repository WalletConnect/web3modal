import BigNumber from 'bignumber.js'

export const NumberUtil = {
  bigNumber(value: BigNumber.Value) {
    return new BigNumber(value)
  },

  /**
   * Format the given number or string to human readable numbers with the given number of decimals
   * @param value - The value to format. It could be a number or string. If it's a string, it will be parsed to a float then formatted.
   * @param decimals - number of decimals after dot
   * @returns
   */
  formatNumberToLocalString(value: string | number | undefined, decimals = 2) {
    if (value === undefined) {
      return '0.00'
    }

    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
      })
    }

    return parseFloat(value).toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    })
  },

  /**
   * Multiply two numbers represented as strings with BigNumber to handle decimals correctly
   * @param a string
   * @param b string
   * @returns
   */
  multiply(a: BigNumber.Value | undefined, b: BigNumber.Value | undefined) {
    if (a === undefined || b === undefined) {
      // eslint-disable-next-line new-cap
      return BigNumber(0)
    }

    const aBigNumber = new BigNumber(a)
    const bBigNumber = new BigNumber(b)

    return aBigNumber.multipliedBy(bBigNumber)
  }
}
