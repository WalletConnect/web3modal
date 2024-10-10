import {
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  OptionsController,
  RouterController,
  type WalletGuideType
} from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { state } from 'lit/decorators/state.js'
import styles from './styles.js'

@customElement('w3m-connect-view')
export class W3mConnectView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  @state() private authConnector = this.connectors.find(c => c.type === 'AUTH')

  @state() private features = OptionsController.state.features

  @property() private walletGuide: WalletGuideType = 'get-started'

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => {
        this.connectors = val
        this.authConnector = this.connectors.find(c => c.type === 'AUTH')
      }),
      OptionsController.subscribeKey('features', val => (this.features = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const socials = this.features?.socials
    const enableWallets = OptionsController.state.enableWallets

    const socialsExist = socials && socials.length
    const socialOrEmailLoginEnabled = socialsExist || this.authConnector

    return html`
      <wui-flex
        flexDirection="column"
        .padding=${socialOrEmailLoginEnabled && enableWallets && this.walletGuide === 'get-started'
          ? ['3xs', 's', '0', 's']
          : ['3xs', 's', 's', 's']}
      >
        <w3m-email-login-widget walletGuide=${this.walletGuide}></w3m-email-login-widget>
        <w3m-social-login-widget></w3m-social-login-widget>
        ${this.walletListTemplate()}
      </wui-flex>
      ${this.guideTemplate()}
      <w3m-legal-footer></w3m-legal-footer>
    `
  }

  // -- Private ------------------------------------------- //
  private walletListTemplate() {
    const socials = this.features?.socials
    const emailShowWallets = this.features?.emailShowWallets
    const enableWallets = OptionsController.state.enableWallets

    if (!enableWallets) {
      return null
    }
    // In tg ios context, we have to preload the connection uri so we can use it to deeplink on user click
    if (CoreHelperUtil.isTelegram() && CoreHelperUtil.isIos()) {
      ConnectionController.connectWalletConnect().catch(_e => ({}))
    }

    if (this.walletGuide === 'explore') {
      return null
    }

    if (this.authConnector && socials) {
      if (this.authConnector && emailShowWallets) {
        return html`
          <wui-flex flexDirection="column" gap="xs" .margin=${['xs', '0', '0', '0'] as const}>
            <w3m-connector-list></w3m-connector-list>
            <wui-flex class="all-wallets">
              <w3m-all-wallets-widget></w3m-all-wallets-widget>
            </wui-flex>
          </wui-flex>
        `
      }

      return html`<wui-list-button
        @click=${this.onContinueWalletClick.bind(this)}
        text="Continue with a wallet"
      ></wui-list-button>`
    }

    return html`<w3m-wallet-login-list></w3m-wallet-login-list>`
  }

  private guideTemplate() {
    const socials = this.features?.socials
    const enableWallets = OptionsController.state.enableWallets

    const socialsExist = socials && socials.length

    if (!this.authConnector && !socialsExist) {
      return null
    }

    if (!enableWallets) {
      return null
    }

    if (this.walletGuide === 'explore') {
      return html`
        <wui-flex flexDirection="column" .padding=${['0', '0', 'xl', '0']}>
          <w3m-wallet-guide walletGuide=${this.walletGuide}></w3m-wallet-guide>
        </wui-flex>
      `
    }

    return html`
      <wui-flex flexDirection="column" .padding=${['xl', '0', 'xl', '0']}>
        <w3m-wallet-guide walletGuide=${this.walletGuide}></w3m-wallet-guide>
      </wui-flex>
    `
  }

  // -- Private Methods ----------------------------------- //
  private onContinueWalletClick() {
    RouterController.push('ConnectWallets')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connect-view': W3mConnectView
  }
}
