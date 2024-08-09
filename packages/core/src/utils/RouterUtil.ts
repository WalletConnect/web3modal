import { RouterController } from '../controllers/RouterController.js'
import { ModalController } from '../controllers/ModalController.js'
import { OptionsController } from '../controllers/OptionsController.js'
import { ChainController } from '../controllers/ChainController.js'
import { ConstantsUtil } from '@web3modal/common'

export const RouterUtil = {
  goBackOrCloseModal() {
    if (RouterController.state.history.length > 1) {
      RouterController.goBack()
    } else {
      ModalController.close()
    }
  },
  navigateAfterNetworkSwitch() {
    const { history } = RouterController.state
    const networkSelectIndex = history.findIndex(name => name === 'Networks')
    if (networkSelectIndex >= 1) {
      RouterController.goBackToIndex(networkSelectIndex - 1)
    } else {
      ModalController.close()
    }
  },

  navigateAfterPreferredAccountTypeSelect() {
    const { isSiweEnabled, isSiwsEnabled } = OptionsController.state
    const isSiwxEnabled = isSiweEnabled || isSiwsEnabled
    const { activeChain } = ChainController.state
    const { CHAIN } = ConstantsUtil

    if (isSiwxEnabled) {
      switch (activeChain) {
        case CHAIN.EVM:
          RouterController.push('ConnectingSiwe')
          break
        case CHAIN.SOLANA:
          RouterController.push('ConnectingSiws')
          break
        default:
          console.warn(`Unsupported chain: ${activeChain}`)
          RouterController.push('Account')
          break
      }
    } else {
      RouterController.push('Account')
    }
  }
}
