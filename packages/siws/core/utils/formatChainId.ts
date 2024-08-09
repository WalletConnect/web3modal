export function formatChainId(name: string | undefined): string {
  if (!name) {
    return ''
  }
  const [base = '', suffix = ''] = name.split(' ')
  const formattedId = suffix ? `${base.toLowerCase()}:${suffix.toLowerCase()}` : base.toLowerCase()

  return formattedId === 'solana' ? 'solana:mainnet' : formattedId
}
