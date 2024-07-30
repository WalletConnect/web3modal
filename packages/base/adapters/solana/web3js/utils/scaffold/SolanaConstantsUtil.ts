import { PublicKey } from '@solana/web3.js'

/**
 * Request methods to the solana RPC.
 * @see {@link https://solana.com/docs}
 */
export const SolConstantsUtil = {
  HASH_PREFIX: 'SPL Name Service',
  /**
   * The `.sol` TLD
   */
  ROOT_DOMAIN_ACCOUNT: new PublicKey('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx'),
  /**
   * The Solana Name Service program ID
   */
  NAME_PROGRAM_ID: new PublicKey('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX'),
  /**
   * The reverse look up class
   */
  REVERSE_LOOKUP_CLASS: new PublicKey('33m47vH6Eav6jr5Ry86XjhRft2jRBLDnDgPSHoquXi2Z'),
  /**
   * Mainnet program ID
   */
  WALLET_ID: '@w3m/solana_wallet',
  CAIP_CHAIN_ID: '@w3m/solana_caip_chain',
  ERROR_CODE_UNRECOGNIZED_CHAIN_ID: 4902,
  ERROR_CODE_DEFAULT: 5000,
  DEFAULT_CHAIN: {
    chainId: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    name: 'Solana',
    currency: 'SOL',
    explorerUrl: 'https://solscan.io',
    rpcUrl: 'https://rpc.walletconnect.com/v1'
  }
}
