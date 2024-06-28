import {
  AccountController,
  ConnectorController,
  CoreHelperUtil,
  ModalController,
  RouterController,
  SnackController,
  type AccountType
} from '@web3modal/core'

import { UiHelperUtil, customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'

@customElement('w3m-profile-view')
export class W3mProfileView extends LitElement {
  public static override styles = styles

  // -- Members -------------------------------------------- //
  private usubscribe: (() => void)[] = []

  // -- State & Properties --------------------------------- //
  @state() private address = AccountController.state.address

  @state() private profileImage = AccountController.state.profileImage

  @state() private profileName = AccountController.state.profileName

  @state() private accounts = AccountController.state.allAccounts

  public constructor() {
    super()
    this.usubscribe.push(
      AccountController.subscribe(val => {
        if (val.address) {
          this.address = val.address
          this.profileImage = val.profileImage
          this.profileName = val.profileName
        } else {
          ModalController.close()
        }
      })
    )
  }

  public override disconnectedCallback() {
    this.usubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.address) {
      throw new Error('w3m-profile-view: No account provided')
    }

    const name = this.profileName?.split('.')[0]

    return html`
      <wui-flex flexDirection="column" gap="l" .padding=${['0', 'xl', 'm', 'xl'] as const}>
        <wui-flex flexDirection="column" alignItems="center" gap="l">
          <wui-avatar
            alt=${this.address}
            address=${this.address}
            imageSrc=${ifDefined(this.profileImage)}
            size="2lg"
          ></wui-avatar>
          <wui-flex flexDirection="column" alignItems="center">
            <wui-flex gap="3xs" alignItems="center" justifyContent="center">
              <wui-text variant="title-6-600" color="fg-100" data-testid="account-settings-address">
                ${name
                  ? UiHelperUtil.getTruncateString({
                      string: name,
                      charsStart: 20,
                      charsEnd: 0,
                      truncate: 'end'
                    })
                  : UiHelperUtil.getTruncateString({
                      string: this.address,
                      charsStart: 4,
                      charsEnd: 6,
                      truncate: 'middle'
                    })}
              </wui-text>
              <wui-icon-link
                size="md"
                icon="copy"
                iconColor="fg-200"
                @click=${this.onCopyAddress}
              ></wui-icon-link>
            </wui-flex>
          </wui-flex>
        </wui-flex>
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="account-settings-button"
          @click=${() => RouterController.push('AccountSettings')}
        >
          <wui-text variant="paragraph-500" color="fg-100">Account Settings</wui-text>
        </wui-flex>
        ${this.accountsTemplate()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private accountsTemplate() {
    return html`<wui-flex flexDirection="column">
      <wui-flex .padding=${['3xs', 'm', 's', 's'] as const}>
        <wui-text color="fg-200" variant="paragraph-400">Your accounts</wui-text>
      </wui-flex>
      <wui-flex flexDirection="column" gap="xxs">
        ${this.accounts.map(account => this.accountTemplate(account))}
      </wui-flex>
    </wui-flex>`
  }

  private async onSwitchAccount(account: AccountType) {
    console.log('onSwitchAccount', account.address)
    AccountController.setShouldUpdateToAddress(account.address)
    const emailConnector = ConnectorController.getAuthConnector()
    if (!emailConnector) {
      return
    }

    await emailConnector.provider.setPreferredAccount(account.type)
    await emailConnector.provider.connect()
  }

  private accountTemplate(account: AccountType) {
    /*
     * Const actions = [
     *   {
     *     label: 'Copy Address',
     *     icon: 'copy',
     *     onClick: () => CoreHelperUtil.copyToClopboard(account.address)
     *   },
     *   {
     *     label: 'Account Settings',
     *     icon: 'copy',
     *     onClick: () => RouterController.push('AccountSettings')
     *   }
     * ]
     */

    return html`<wui-list-account accountAddress=${account.address} accountType=${account.type}>
      ${account.address === this.address
        ? ''
        : html`<wui-button
            slot="action"
            textVariant="small-600"
            size="sm"
            variant="accent"
            @click=${() => this.onSwitchAccount(account)}
            >Switch</wui-button
          >`}
    </wui-list-account> `
  }

  private onCopyAddress() {
    try {
      if (this.profileName) {
        CoreHelperUtil.copyToClopboard(this.profileName)
        SnackController.showSuccess('Name copied')
      } else if (this.address) {
        CoreHelperUtil.copyToClopboard(this.address)
        SnackController.showSuccess('Address copied')
      }
    } catch {
      SnackController.showError('Failed to copy')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-profile-view': W3mProfileView
  }
}
