import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('w3m-connect-socials-view')
export class W3mConnectSocialsView extends LitElement {
  public static override styles = styles

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" padding="s" gap="xs">
        <w3m-social-login-list></w3m-social-login-list>
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connect-socials-view': W3mConnectSocialsView
  }
}
