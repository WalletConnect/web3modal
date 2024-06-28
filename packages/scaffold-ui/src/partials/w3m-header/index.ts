import type { RouterControllerState } from '@web3modal/core'
import {
  AccountController,
  ConnectionController,
  ConnectorController,
  EventsController,
  ModalController,
  OptionsController,
  RouterController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'

// -- Constants ----------------------------------------- //
const BETA_SCREENS = ['Swap', 'SwapSelectToken', 'SwapPreview']

// -- Helpers ------------------------------------------- //
function headings() {
  const connectorName = RouterController.state.data?.connector?.name
  const walletName = RouterController.state.data?.wallet?.name
  const networkName = RouterController.state.data?.network?.name
  const name = walletName ?? connectorName
  const connectors = ConnectorController.getConnectors()
  const isEmail = connectors.length === 1 && connectors[0]?.id === 'w3m-email'

  return {
    Connect: `Connect ${isEmail ? 'Email' : ''} Wallet`,
    ChooseAccountName: undefined,
    Account: undefined,
    AccountSettings: undefined,
    ConnectingExternal: name ?? 'Connect Wallet',
    ConnectingWalletConnect: name ?? 'WalletConnect',
    ConnectingSiwe: 'Sign In',
    Networks: 'Choose Network',
    SwitchNetwork: networkName ?? 'Switch Network',
    AllWallets: 'All Wallets',
    WhatIsANetwork: 'What is a network?',
    WhatIsAWallet: 'What is a wallet?',
    GetWallet: 'Get a wallet',
    Downloads: name ? `Get ${name}` : 'Downloads',
    EmailVerifyOtp: 'Confirm Email',
    EmailVerifyDevice: 'Register Device',
    ApproveTransaction: 'Approve Transaction',
    Transactions: 'Activity',
    UpgradeEmailWallet: 'Upgrade your Wallet',
    UpgradeToSmartAccount: undefined,
    UpdateEmailWallet: 'Edit Email',
    UpdateEmailPrimaryOtp: 'Confirm Current Email',
    UpdateEmailSecondaryOtp: 'Confirm New Email',
    UnsupportedChain: 'Switch Network',
    OnRampProviders: 'Choose Provider',
    OnRampActivity: 'Activity',
    WhatIsABuy: 'What is Buy?',
    BuyInProgress: 'Buy',
    OnRampTokenSelect: 'Select Token',
    OnRampFiatSelect: 'Select Currency',
    RegisterAccountName: 'Choose name',
    RegisterAccountNameSuccess: '',
    WalletReceive: 'Receive',
    WalletCompatibleNetworks: 'Compatible Networks',
    Swap: 'Swap',
    SwapSelectToken: 'Select token',
    SwapPreview: 'Preview swap',
    WalletSend: 'Send',
    WalletSendPreview: 'Review send',
    WalletSendSelectToken: 'Select Token',
    ConnectWallets: 'Connect wallet',
    ConnectSocials: 'All socials',
    ConnectingSocial: AccountController.state.socialProvider
      ? AccountController.state.socialProvider
      : 'Connect Social'
  }
}

@customElement('w3m-header')
export class W3mHeader extends LitElement {
  public static override styles = [styles]

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties --------------------------------- //
  @state() private heading = headings()[RouterController.state.view]

  @state() private buffering = false

  @state() private showBack = false

  public constructor() {
    super()
    this.unsubscribe.push(
      RouterController.subscribeKey('view', val => {
        this.onViewChange(val)
        this.onHistoryChange()
      }),
      ConnectionController.subscribeKey('buffering', val => (this.buffering = val))
    )
  }

  disconnectCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex .padding=${this.getPadding()} justifyContent="space-between" alignItems="center">
        ${this.dynamicButtonTemplate()} ${this.titleTemplate()}
        <wui-icon-link
          ?disabled=${this.buffering}
          icon="close"
          @click=${this.onClose.bind(this)}
          data-testid="w3m-header-close"
        ></wui-icon-link>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  private onWalletHelp() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_WALLET_HELP' })
    RouterController.push('WhatIsAWallet')
  }

  private async onClose() {
    if (OptionsController.state.isSiweEnabled) {
      const { SIWEController } = await import('@web3modal/siwe')
      if (SIWEController.state.status !== 'success' && this.isConnected) {
        await ConnectionController.disconnect()
      }
    }
    ModalController.close()
  }

  private titleTemplate() {
    const isBeta = BETA_SCREENS.includes(RouterController.state.view)

    return html`
      <wui-flex class="w3m-header-title" alignItems="center" gap="xs">
        <wui-text variant="paragraph-700" color="fg-100">${this.heading}</wui-text>
        ${isBeta ? html`<wui-tag variant="main">Beta</wui-tag>` : null}
      </wui-flex>
    `
  }

  private dynamicButtonTemplate() {
    const { view } = RouterController.state
    const isConnectHelp = view === 'Connect'
    const isApproveTransaction = view === 'ApproveTransaction'
    const isUpgradeToSmartAccounts = view === 'UpgradeToSmartAccount'
    const isConnectingSIWEView = view === 'ConnectingSiwe'

    const shouldHideBack = isApproveTransaction || isUpgradeToSmartAccounts || isConnectingSIWEView

    if (this.showBack && !shouldHideBack) {
      return html`<wui-icon-link
        id="dynamic"
        icon="chevronLeft"
        ?disabled=${this.buffering}
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-link>`
    }

    return html`<wui-icon-link
      data-hidden=${!isConnectHelp}
      id="dynamic"
      icon="helpCircle"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-link>`
  }

  private getPadding() {
    if (this.heading) {
      return ['l', '2l', 'l', '2l'] as const
    }

    return ['l', '2l', '0', '2l'] as const
  }

  private async onViewChange(view: RouterControllerState['view']) {
    const headingEl = this.shadowRoot?.querySelector('wui-flex.w3m-header-title')

    if (headingEl) {
      const preset = headings()[view]
      await headingEl.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.heading = preset
      headingEl.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }

  private async onHistoryChange() {
    const { history } = RouterController.state
    const buttonEl = this.shadowRoot?.querySelector('#dynamic')
    if (history.length > 1 && !this.showBack && buttonEl) {
      await buttonEl.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.showBack = true
      buttonEl.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      })
    } else if (history.length <= 1 && this.showBack && buttonEl) {
      await buttonEl.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.showBack = false
      buttonEl.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }

  private onGoBack() {
    RouterController.goBack()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-header': W3mHeader
  }
}
