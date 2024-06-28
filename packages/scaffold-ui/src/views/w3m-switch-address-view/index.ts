import {
  AccountController,
  BlockchainApiController,
  ModalController,
  NetworkController,
  OptionsController,
  StorageUtil,
  type AccountType
} from '@web3modal/core'
import { UiHelperUtil, customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'

@customElement('w3m-switch-address-view')
export class W3mSwitchAddressView extends LitElement {
  public static override styles = styles
  // -- Members ------------------------------------------- //
  private readonly metadata = OptionsController.state.metadata
  public allAccounts: AccountType[] = AccountController.state.allAccounts || []
  public readonly labels = AccountController.state.addressLabels
  public readonly currentAddress: string = AccountController.state.address || ''
  private balances: Record<string, number> = {}
  private connectedConnector = StorageUtil.getConnectedConnector()
  // Only show icon for AUTH accounts
  private shouldShowIcon = this.connectedConnector === 'AUTH'
  private caipNetwork = NetworkController.state.caipNetwork

  constructor() {
    super()
    AccountController.subscribeKey('allAccounts', allAccounts => {
      this.allAccounts = allAccounts
      this.requestUpdate()
    })
  }

  public override connectedCallback() {
    super.connectedCallback()
    this.allAccounts.forEach(account => {
      BlockchainApiController.getBalance(account.address, this.caipNetwork?.id).then(response => {
        let total = this.balances[account.address] || 0
        if (response.balances.length > 0) {
          total = response.balances.reduce((acc, balance) => {
            return acc + (balance?.value || 0)
          }, 0)
        }
        this.balances[account.address] = total
        this.requestUpdate()
      })
    })
  }

  public getAddressIcon(type: AccountType['type']) {
    if (type === 'smartAccount') {
      return 'lightbulb'
    }

    return 'mail'
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex justifyContent="center" .padding=${['xl', '0', 'xl', '0'] as const}>
        <wui-banner-img
          imageSrc="${this.metadata?.icons[0]}"
          text="${this.metadata?.url}"
          size="sm"
        ></wui-banner-img>
      </wui-flex>
      <wui-flex flexDirection="column" gap="xxl" .padding=${['l', 'xl', 'xl', 'xl'] as const}>
        ${this.allAccounts.map(account => {
          return this.getAddressTemplate(account)
        })}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  private getAddressTemplate(account: AccountType) {
    // If there is custom label for the address, use it
    const label = this.labels?.get(account.address)
    console.log('getAddressTemplate', account.address, this.allAccounts, label)

    return html`
      <wui-flex flexDirection="row" justifyContent="space-between">
        <wui-flex alignItems="center">
          <wui-avatar address=${account.address}></wui-avatar>
          ${this.shouldShowIcon
            ? html`<wui-icon-box
                size="sm"
                iconcolor="fg-200"
                backgroundcolor="glass-002"
                background="gray"
                icon="${this.getAddressIcon(account.type)}"
                ?border=${true}
              ></wui-icon-box>`
            : html`<wui-flex .padding="${['0', '0', '0', 's'] as const}"></wui-flex>`}
          <wui-flex flexDirection="column">
            <wui-text class="address" variant="paragraph-500" color="fg-100"
              >${label
                ? label
                : UiHelperUtil.getTruncateString({
                    string: account.address,
                    charsStart: 4,
                    charsEnd: 6,
                    truncate: 'middle'
                  })}</wui-text
            >
            <wui-text class="address-description" variant="small-400">
              ${typeof this.balances[account.address] === 'number'
                ? `$${this.balances[account.address]?.toFixed(2)}`
                : html`<wui-loading-spinner size="sm" color="accent-100"></wui-loading-spinner>`}
            </wui-text>
          </wui-flex>
        </wui-flex>
        <wui-flex gap="s" alignItems="center">
          ${account.address?.toLowerCase() === this.currentAddress?.toLowerCase()
            ? ''
            : html`
                <wui-button
                  textVariant="small-600"
                  size="md"
                  variant="accent"
                  @click=${() => this.onSwitchAddress(account.address)}
                  >Switch to</wui-button
                >
              `}
        </wui-flex>
      </wui-flex>
    `
  }

  private onSwitchAddress(address: string) {
    console.log('onSwitchAddress', address)
    AccountController.setShouldUpdateToAddress(address)
    ModalController.close()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-switch-address-view': W3mSwitchAddressView
  }
}
