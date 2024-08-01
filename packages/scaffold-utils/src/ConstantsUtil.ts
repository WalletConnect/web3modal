export const ConstantsUtil = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  WALLET_STANDARD_CONNECTOR_ID: 'announced',
  COINBASE_CONNECTOR_ID: 'coinbaseWallet',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  SAFE_CONNECTOR_ID: 'safe',
  LEDGER_CONNECTOR_ID: 'ledger',
  EIP6963_CONNECTOR_ID: 'eip6963',
  AUTH_CONNECTOR_ID: 'w3mAuth',
  EIP155: 'eip155',
  ADD_CHAIN_METHOD: 'wallet_addEthereumChain',
  EIP6963_ANNOUNCE_EVENT: 'eip6963:announceProvider',
  EIP6963_REQUEST_EVENT: 'eip6963:requestProvider',
  CONNECTOR_RDNS_MAP: {
    coinbaseWallet: 'com.coinbase.wallet',
    coinbaseWalletSDK: 'com.coinbase.wallet'
  } as Record<string, string>,
  VERSION: '5.0.11'
}
