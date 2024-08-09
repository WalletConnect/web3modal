import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { OptionsController, StorageUtil } from '@web3modal/core'

@customElement('w3m-connecting-siws')
export class W3mConnectingSiws extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private readonly dappImageUrl = OptionsController.state.metadata?.icons

  private readonly walletImageUrl = StorageUtil.getConnectedWalletImageUrl()

  public override firstUpdated() {
    const visuals = this.shadowRoot?.querySelectorAll('wui-visual-thumbnail')

    if (visuals?.[0]) {
      this.createAnimation(visuals[0], 'translate(18px)')
    }
    if (visuals?.[1]) {
      this.createAnimation(visuals[1], 'translate(-18px)')
    }
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-visual-thumbnail
        ?borderRadiusFull=${true}
        .imageSrc=${this.dappImageUrl?.[0]}
      ></wui-visual-thumbnail>
      <wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></wui-visual-thumbnail>
    `
  }

  // -- Private ------------------------------------------- //
  private createAnimation(element: HTMLElement, translation: string) {
    element.animate([{ transform: 'translateX(0px)' }, { transform: translation }], {
      duration: 1600,
      easing: 'cubic-bezier(0.56, 0, 0.48, 1)',
      direction: 'alternate',
      iterations: Infinity
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-siws': W3mConnectingSiws
  }
}
