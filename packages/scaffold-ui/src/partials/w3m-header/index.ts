import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import {
  AssetController,
  AssetUtil,
  ChainController,
  ConnectorController,
  EventsController,
  ModalUtil,
  OptionsController,
  RouterController
} from '@reown/appkit-controllers'
import { customElement, vars } from '@reown/appkit-ui'
import '@reown/appkit-ui/wui-flex'
import '@reown/appkit-ui/wui-icon-button'
import '@reown/appkit-ui/wui-select'
import '@reown/appkit-ui/wui-tag'
import '@reown/appkit-ui/wui-text'

import { ConstantsUtil } from '../../utils/ConstantsUtil.js'
import '../w3m-pay-header/index.js'
import styles from './styles.js'

// -- Constants ----------------------------------------- //
const BETA_SCREENS: string[] = ['SmartSessionList']
const BACKGROUND_OVERRIDES: Record<string, string> = {
  PayWithExchange: vars.tokens.theme.foregroundPrimary
}

// -- Helpers ------------------------------------------- //
function headings() {
  const connectorName = RouterController.state.data?.connector?.name
  const walletName = RouterController.state.data?.wallet?.name
  const networkName = RouterController.state.data?.network?.name
  const name = walletName ?? connectorName
  const connectors = ConnectorController.getConnectors()
  const isEmail = connectors.length === 1 && connectors[0]?.id === 'w3m-email'
  const socialProvider = ChainController.getAccountData()?.socialProvider
  const socialTitle = socialProvider
    ? socialProvider.charAt(0).toUpperCase() + socialProvider.slice(1)
    : 'Connect Social'

  return {
    Connect: `Connect ${isEmail ? 'Email' : ''} Wallet`,
    Create: 'Create Wallet',
    ChooseAccountName: undefined,
    Account: undefined,
    AccountSettings: undefined,
    AllWallets: 'All Wallets',
    ApproveTransaction: 'Approve Transaction',
    BuyInProgress: 'Buy',
    UsageExceeded: 'Usage Exceeded',
    ConnectingExternal: name ?? 'Connect Wallet',
    ConnectingWalletConnect: name ?? 'WalletConnect',
    ConnectingWalletConnectBasic: 'WalletConnect',
    ConnectingSiwe: 'Confirm it’s you',
    Convert: 'Convert',
    ConvertSelectToken: 'Select token',
    ConvertPreview: 'Preview Convert',
    Downloads: name ? `Get ${name}` : 'Downloads',
    EmailLogin: 'Email Login',
    EmailVerifyOtp: 'Confirm Email',
    EmailVerifyDevice: 'Register Device',
    GetWallet: 'Get a Wallet',
    Networks: 'Choose Network',
    OnRampProviders: 'Choose Provider',
    OnRampActivity: 'Activity',
    OnRampTokenSelect: 'Select Token',
    OnRampFiatSelect: 'Select Currency',
    Pay: 'How you pay',
    ProfileWallets: 'Wallets',
    SwitchNetwork: networkName ?? 'Switch Network',
    Transactions: 'Activity',
    UnsupportedChain: 'Switch Network',
    UpgradeEmailWallet: 'Upgrade Your Wallet',
    UpdateEmailWallet: 'Edit Email',
    UpdateEmailPrimaryOtp: 'Confirm Current Email',
    UpdateEmailSecondaryOtp: 'Confirm New Email',
    WhatIsABuy: 'What is Buy?',
    RegisterAccountName: 'Choose Name',
    RegisterAccountNameSuccess: '',
    WalletReceive: 'Receive',
    WalletCompatibleNetworks: 'Compatible Networks',
    Swap: 'Swap',
    SwapSelectToken: 'Select Token',
    SwapPreview: 'Preview Swap',
    WalletSend: 'Send',
    WalletSendPreview: 'Review Send',
    WalletSendSelectToken: 'Select Token',
    WalletSendConfirmed: 'Confirmed',
    WhatIsANetwork: 'What is a network?',
    WhatIsAWallet: 'What is a Wallet?',
    ConnectWallets: 'Connect Wallet',
    ConnectSocials: 'All Socials',
    ConnectingSocial: socialTitle,
    ConnectingMultiChain: 'Select Chain',
    ConnectingFarcaster: 'Farcaster',
    SwitchActiveChain: 'Switch Chain',
    SmartSessionCreated: undefined,
    SmartSessionList: 'Smart Sessions',
    SIWXSignMessage: 'Confirm it’s you',
    PayLoading: 'Processing payment...',
    PayQuote: 'Payment Quote',
    DataCapture: 'Profile',
    DataCaptureOtpConfirm: 'Confirm Email',
    FundWallet: 'Fund Wallet',
    PayWithExchange: 'Deposit from Exchange',
    PayWithExchangeSelectAsset: 'Select Asset',
    SmartAccountSettings: 'Smart Account Settings'
  }
}

@customElement('w3m-header')
export class W3mHeader extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties --------------------------------- //
  @state() private heading = headings()[RouterController.state.view]

  @state() private network = ChainController.state.activeCaipNetwork

  @state() private networkImage = AssetUtil.getNetworkImage(this.network)

  @state() private showBack = false

  @state() private prevHistoryLength = 1

  @state() private view = RouterController.state.view

  @state() private viewDirection = ''

  public constructor() {
    super()
    this.unsubscribe.push(
      AssetController.subscribeNetworkImages(() => {
        this.networkImage = AssetUtil.getNetworkImage(this.network)
      }),
      RouterController.subscribeKey('view', val => {
        setTimeout(() => {
          this.view = val
          this.heading = headings()[val]
        }, ConstantsUtil.ANIMATION_DURATIONS.HeaderText)
        this.onViewChange()
        this.onHistoryChange()
      }),
      ChainController.subscribeKey('activeCaipNetwork', val => {
        this.network = val
        this.networkImage = AssetUtil.getNetworkImage(this.network)
      })
    )
  }

  disconnectCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const backgroundColor =
      BACKGROUND_OVERRIDES[RouterController.state.view] ?? vars.tokens.theme.backgroundPrimary

    this.style.setProperty('--local-header-background-color', backgroundColor)

    return html`
      <wui-flex
        .padding=${['0', '4', '0', '4'] as const}
        justifyContent="space-between"
        alignItems="center"
      >
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  // Temporarily added to test connecting with SIWE, replace with 'WhatIsAWallet' again when approved
  private onWalletHelp() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_WALLET_HELP' })
    RouterController.push('WhatIsAWallet')
  }

  private async onClose() {
    await ModalUtil.safeClose()
  }

  private rightHeaderTemplate() {
    const isSmartSessionsEnabled = OptionsController?.state?.features?.smartSessions

    if (RouterController.state.view !== 'Account' || !isSmartSessionsEnabled) {
      return this.closeButtonTemplate()
    }

    return html`<wui-flex>
      <wui-icon-button
        icon="clock"
        size="lg"
        iconSize="lg"
        type="neutral"
        variant="primary"
        @click=${() => RouterController.push('SmartSessionList')}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-button>
      ${this.closeButtonTemplate()}
    </wui-flex> `
  }

  private closeButtonTemplate() {
    return html`
      <wui-icon-button
        icon="close"
        size="lg"
        type="neutral"
        variant="primary"
        iconSize="lg"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-button>
    `
  }

  private titleTemplate() {
    if (this.view === 'PayQuote') {
      return html`<w3m-pay-header></w3m-pay-header>`
    }

    const isBeta = BETA_SCREENS.includes(this.view)

    return html`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="2"
      >
        <wui-text
          display="inline"
          variant="lg-regular"
          color="primary"
          data-testid="w3m-header-text"
        >
          ${this.heading}
        </wui-text>
        ${isBeta ? html`<wui-tag variant="accent" size="md">Beta</wui-tag>` : null}
      </wui-flex>
    `
  }

  private leftHeaderTemplate() {
    const { view } = RouterController.state
    const isConnectHelp = view === 'Connect'
    const isEmbeddedEnable = OptionsController.state.enableEmbedded
    const isApproveTransaction = view === 'ApproveTransaction'
    const isConnectingSIWEView = view === 'ConnectingSiwe'
    const isAccountView = view === 'Account'
    const enableNetworkSwitch = OptionsController.state.enableNetworkSwitch

    const shouldHideBack =
      isApproveTransaction || isConnectingSIWEView || (isConnectHelp && isEmbeddedEnable)

    if (isAccountView && enableNetworkSwitch) {
      return html`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${ifDefined(this.network?.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${ifDefined(this.networkImage)}
      ></wui-select>`
    }

    if (this.showBack && !shouldHideBack) {
      return html`<wui-icon-button
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        size="lg"
        iconSize="lg"
        type="neutral"
        variant="primary"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-button>`
    }

    return html`<wui-icon-button
      data-hidden=${!isConnectHelp}
      id="dynamic"
      icon="helpCircle"
      size="lg"
      iconSize="lg"
      type="neutral"
      variant="primary"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-button>`
  }

  private onNetworks() {
    if (this.isAllowedNetworkSwitch()) {
      EventsController.sendEvent({ type: 'track', event: 'CLICK_NETWORKS' })
      RouterController.push('Networks')
    }
  }

  private isAllowedNetworkSwitch() {
    const requestedCaipNetworks = ChainController.getAllRequestedCaipNetworks()
    const isMultiNetwork = requestedCaipNetworks ? requestedCaipNetworks.length > 1 : false
    const isValidNetwork = requestedCaipNetworks?.find(({ id }) => id === this.network?.id)

    return isMultiNetwork || !isValidNetwork
  }

  private onViewChange() {
    const { history } = RouterController.state

    let direction = ConstantsUtil.VIEW_DIRECTION.Next
    if (history.length < this.prevHistoryLength) {
      direction = ConstantsUtil.VIEW_DIRECTION.Prev
    }
    this.prevHistoryLength = history.length
    this.viewDirection = direction
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
