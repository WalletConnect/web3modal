import {
  AccountController,
  ModalController,
  NetworkController,
  AssetUtil,
  RouterController,
  CoreHelperUtil,
  ConstantsUtil as CoreConstantsUtil,
  EventsController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'
import { ConstantsUtil } from '../../utils/ConstantsUtil.js'
import { W3mFrameRpcConstants } from '@web3modal/wallet'

const TABS = 3
const TABS_PADDING = 48
const MODAL_MOBILE_VIEW_PX = 430

@customElement('w3m-account-wallet-features-widget')
export class W3mAccountWalletFeaturesWidget extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  @state() private watchTokenBalance?: ReturnType<typeof setInterval>

  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private address = AccountController.state.address

  @state() private profileImage = AccountController.state.profileImage

  @state() private profileName = AccountController.state.profileName

  @state() private smartAccountDeployed = AccountController.state.smartAccountDeployed

  @state() private network = NetworkController.state.caipNetwork

  @state() private currentTab = AccountController.state.currentTab

  @state() private tokenBalance = AccountController.state.tokenBalance

  @state() private preferredAccountType = AccountController.state.preferredAccountType

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        AccountController.subscribe(val => {
          if (val.address) {
            this.address = val.address
            this.profileImage = val.profileImage
            this.profileName = val.profileName
            this.currentTab = val.currentTab
            this.tokenBalance = val.tokenBalance
            this.smartAccountDeployed = val.smartAccountDeployed
            this.preferredAccountType = val.preferredAccountType
          } else {
            ModalController.close()
          }
        })
      ],
      NetworkController.subscribe(val => {
        this.network = val.caipNetwork
      })
    )
    this.watchSwapValues()
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
    clearInterval(this.watchTokenBalance)
  }

  public override firstUpdated() {
    AccountController.fetchTokenBalance()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.address) {
      throw new Error('w3m-account-view: No account provided')
    }

    const networkImage = AssetUtil.getNetworkImage(this.network)

    return html`<wui-flex
      flexDirection="column"
      .padding=${['0', 'xl', 'm', 'xl'] as const}
      alignItems="center"
      gap="m"
    >
      ${this.activateAccountTemplate()}
      <wui-profile-button
        @click=${this.onProfileButtonClick.bind(this)}
        address=${ifDefined(this.address)}
        networkSrc=${ifDefined(networkImage)}
        icon="chevronBottom"
        avatarSrc=${ifDefined(this.profileImage ? this.profileImage : undefined)}
        profileName=${this.profileName}
        data-testid="w3m-profile-button"
      ></wui-profile-button>
      ${this.tokenBalanceTemplate()}
      <wui-flex gap="s">
        <w3m-tooltip-trigger text="Buy">
          <wui-icon-button @click=${this.onBuyClick.bind(this)} icon="card"></wui-icon-button>
        </w3m-tooltip-trigger>
        <w3m-tooltip-trigger text="Swap">
          <wui-icon-button @click=${this.onSwapClick.bind(this)} icon="recycleHorizontal">
          </wui-icon-button>
        </w3m-tooltip-trigger>
        <w3m-tooltip-trigger text="Receive">
          <wui-icon-button @click=${this.onReceiveClick.bind(this)} icon="arrowBottomCircle">
          </wui-icon-button>
        </w3m-tooltip-trigger>
        <w3m-tooltip-trigger text="Send">
          <wui-icon-button @click=${this.onSendClick.bind(this)} icon="send"></wui-icon-button>
        </w3m-tooltip-trigger>
      </wui-flex>

      <wui-tabs
        .onTabChange=${this.onTabChange.bind(this)}
        .activeTab=${this.currentTab}
        localTabWidth=${CoreHelperUtil.isMobile() && window.innerWidth < MODAL_MOBILE_VIEW_PX
          ? `${(window.innerWidth - TABS_PADDING) / TABS}px`
          : '104px'}
        .tabs=${ConstantsUtil.ACCOUNT_TABS}
      ></wui-tabs>
      ${this.listContentTemplate()}
    </wui-flex>`
  }

  // -- Private ------------------------------------------- //
  private watchSwapValues() {
    this.watchTokenBalance = setInterval(() => AccountController.fetchTokenBalance(), 10000)
  }

  private listContentTemplate() {
    if (this.currentTab === 0) {
      return html`<w3m-account-tokens-widget></w3m-account-tokens-widget>`
    }
    if (this.currentTab === 1) {
      return html`<w3m-account-nfts-widget></w3m-account-nfts-widget>`
    }
    if (this.currentTab === 2) {
      return html`<w3m-account-activity-widget></w3m-account-activity-widget>`
    }

    return html`<w3m-account-tokens-widget></w3m-account-tokens-widget>`
  }

  private tokenBalanceTemplate() {
    if (this.tokenBalance && this.tokenBalance?.length >= 0) {
      const value = CoreHelperUtil.calculateBalance(this.tokenBalance)
      const { dollars = '0', pennies = '00' } = CoreHelperUtil.formatTokenBalance(value)

      return html`<wui-balance dollars=${dollars} pennies=${pennies}></wui-balance>`
    }

    return html`<wui-balance dollars="0" pennies="00"></wui-balance>`
  }

  private activateAccountTemplate() {
    const smartAccountEnabled = NetworkController.checkIfSmartAccountEnabled()

    if (
      !smartAccountEnabled ||
      this.preferredAccountType !== W3mFrameRpcConstants.ACCOUNT_TYPES.EOA ||
      this.smartAccountDeployed
    ) {
      return null
    }

    return html` <wui-promo
      text=${'Activate your account'}
      @click=${this.onUpdateToSmartAccount.bind(this)}
      data-testid="activate-smart-account-promo"
    ></wui-promo>`
  }

  private onTabChange(index: number) {
    AccountController.setCurrentTab(index)
  }

  private onProfileButtonClick() {
    RouterController.push('AccountSettings')
  }

  private onBuyClick() {
    RouterController.push('OnRampProviders')
  }

  private onSwapClick() {
    if (this.network?.id && !CoreConstantsUtil.SWAP_SUPPORTED_NETWORKS.includes(this.network?.id)) {
      RouterController.push('UnsupportedChain', {
        swapUnsupportedChain: true
      })
    } else {
      EventsController.sendEvent({
        type: 'track',
        event: 'OPEN_SWAP',
        properties: {
          network: this.network?.id || '',
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
        }
      })
      RouterController.push('Swap')
    }
  }

  private onReceiveClick() {
    RouterController.push('WalletReceive')
  }

  private onSendClick() {
    EventsController.sendEvent({
      type: 'track',
      event: 'OPEN_SEND',
      properties: {
        network: this.network?.id || '',
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
    RouterController.push('WalletSelectSend')
  }

  private onUpdateToSmartAccount() {
    RouterController.push('UpgradeToSmartAccount')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-account-wallet-features-widget': W3mAccountWalletFeaturesWidget
  }
}
