import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-icon/index.js'
import '../../components/wui-text/index.js'
import '../../components/wui-image/index.js'
import '../../layout/wui-flex/index.js'
import '../wui-avatar/index.js'
import '../wui-icon-box/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'
import type { IconType } from '../../utils/TypeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { StorageUtil } from '@web3modal/core'

@customElement('wui-profile-button-v2')
export class WuiProfileButtonV2 extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public avatarSrc?: string = undefined

  @property() public profileName?: string = ''

  @property() public address = ''

  @property() public icon: IconType = 'mail'

  @property() public onProfileClick?: (event: Event) => void

  @property() public onCopyClick?: (event: Event) => void

  private connectedConnector = StorageUtil.getConnectedConnector()

  private shouldShowIcon = this.connectedConnector === 'AUTH'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button ontouchstart data-testid="wui-profile-button" @click=${this.handleClick}>
      <wui-flex gap="xs" alignItems="center">
        <wui-avatar
          .imageSrc=${this.avatarSrc}
          alt=${this.address}
          address=${this.address}
        ></wui-avatar>
        ${this.shouldShowIcon ? this.getIconTemplate(this.icon) : ''}
        <wui-flex gap="xs" alignItems="center">
          <wui-text variant="large-600" color="fg-100">
            ${UiHelperUtil.getTruncateString({
              string: this.profileName || this.address,
              charsStart: this.profileName ? 18 : 4,
              charsEnd: this.profileName ? 0 : 4,
              truncate: this.profileName ? 'end' : 'middle'
            })}
          </wui-text>
          <wui-icon size="sm" color="fg-200" name="copy" id="copy-address"></wui-icon>
        </wui-flex>
      </wui-flex>
    </button>`
  }

  private handleClick(event: Event) {
    if (event.target instanceof HTMLElement && event.target.id === 'copy-address') {
      this.onCopyClick?.(event)

      return
    }
    this.onProfileClick?.(event)
  }

  // -- Private ------------------------------------------- //
  private getIconTemplate(icon: IconType) {
    return html`
      <wui-icon-box
        size="xxs"
        iconColor="fg-200"
        backgroundColor="bg-100"
        icon="${icon || 'networkPlaceholder'}"
      ></wui-icon-box>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-profile-button-v2': WuiProfileButtonV2
  }
}
