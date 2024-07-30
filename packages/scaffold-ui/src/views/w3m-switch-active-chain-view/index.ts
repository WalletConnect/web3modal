import { ChainController, RouterController } from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { ConstantsUtil } from '@web3modal/common'
import { property } from 'lit/decorators.js'

@customElement('w3m-switch-active-chain-view')
export class W3mSwitchActiveChainView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  protected readonly switchToChain = RouterController.state.data?.switchToChain

  protected readonly navigateTo = RouterController.state.data?.navigateTo

  protected readonly navigateWithReplace = RouterController.state.data?.navigateWithReplace

  // -- State & Properties -------------------------------- //
  @property() public activeChain = ChainController.state.activeChain

  // -- Lifecycle ----------------------------------------- //
  public override firstUpdated() {
    this.unsubscribe.push(
      ChainController.subscribeKey('activeChain', val => (this.activeChain = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const chainNameString = this.activeChain
      ? ConstantsUtil.CHAIN_NAME_MAP[this.activeChain]
      : 'current'
    const switchedChainNameString = this.switchToChain
      ? ConstantsUtil.CHAIN_NAME_MAP[this.switchToChain]
      : 'supported'

    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['3xl', 'xl', 'xl', 'xl'] as const}
        gap="xl"
      >
        <wui-flex justifyContent="center" flexDirection="column" alignItems="center" gap="xl">
          <wui-visual name="eth"></wui-visual>
          <wui-text variant="paragraph-500" color="fg-100" align="center">Switch to EVM</wui-text>
          <wui-text variant="small-400" color="fg-200" align="center">
            This feature is not supported on the ${chainNameString} chain. Switch to
            ${switchedChainNameString} chain to proceed using it.
          </wui-text>
          <wui-button size="md" @click=${this.switchActiveChain.bind(this)}>Switch</wui-button>
        </wui-flex>
      </wui-flex>
    `
  }

  // -- Private Methods ------------------------------------ //
  private switchActiveChain() {
    if (!this.switchToChain) {
      return
    }

    ChainController.setActiveChain(this.switchToChain)
    if (this.navigateTo) {
      if (this.navigateWithReplace) {
        RouterController.replace(this.navigateTo)
      } else {
        RouterController.push(this.navigateTo)
      }
    } else {
      RouterController.goBack()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-switch-active-chain-view': W3mSwitchActiveChainView
  }
}
