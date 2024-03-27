/**
 * Format the given number or string to human readable numbers with the given number of decimals
 * @param value - The value to format. It could be a number or string. If it's a string, it will be parsed to a float then formatted.
 * @param decimals - number of decimals after dot
 * @returns
 */
export function formatNumberToLocalString(value: string | number | undefined, decimals = 2) {
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
}
