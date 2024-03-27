/**
 * Interpolates a value from one range to another
 * @param inputRange - number array of length 2 that represents the original range
 * @param outputRange - number array of length 2 that represents the new range
 * @param value - the value to interpolation
 * @returns
 */
export function interpolate(inputRange: number[], outputRange: number[], value: number) {
  if (inputRange.length !== 2 || outputRange.length !== 2) {
    throw new Error('inputRange and outputRange must be an array of length 2')
  }

  const originalRangeMin = inputRange[0] || 0
  const originalRangeMax = inputRange[1] || 0
  const newRangeMin = outputRange[0] || 0
  const newRangeMax = outputRange[1] || 0

  if (value < originalRangeMin) {
    return newRangeMin
  }
  if (value > originalRangeMax) {
    return newRangeMax
  }

  return (
    ((newRangeMax - newRangeMin) / (originalRangeMax - originalRangeMin)) *
      (value - originalRangeMin) +
    newRangeMin
  )
}
