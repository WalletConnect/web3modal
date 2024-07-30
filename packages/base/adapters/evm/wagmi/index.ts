import '@web3modal/polyfills'

export { EVMWagmiClient } from './client.js'

// -- Types
export type { AdapterOptions } from './client.js'

// -- Utils
export { defaultWagmiConfig as defaultWagmiCoreConfig } from './utils/defaultWagmiCoreConfig.js'
export { defaultWagmiConfig as defaultWagmiReactConfig } from './utils/defaultWagmiReactConfig.js'

// -- Connectors
export { authConnector } from './connectors/AuthConnector.js'
