import { injected } from './injected.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'

export function eip6963() {
  return injected({
    type: 'eip6963',
    id: ConstantsUtil.EIP6963_CONNECTOR_ID
  })
}
