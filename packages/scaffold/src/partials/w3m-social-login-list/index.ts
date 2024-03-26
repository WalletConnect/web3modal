import { ConnectorController } from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
@customElement('w3m-social-login-list')
export class W3mSocialLoginList extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  private connector = this.connectors.find(c => c.type === 'AUTH')

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => {
        this.connectors = val
        this.connector = this.connectors.find(c => c.type === 'AUTH')
      })
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.connector?.socials) {
      return null
    }

    return html` <wui-flex flexDirection="column" gap="xs">
      ${this.connector.socials.map(
        social => html`<wui-list-social name=${social} logo=${social}></wui-list-social>`
      )}
    </wui-flex>`
  }

  // -- Private ------------------------------------------- //
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-social-login-list': W3mSocialLoginList
  }
}
