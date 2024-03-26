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

@customElement('wui-profile-button')
export class WuiProfileButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public networkSrc?: string = undefined

  @property() public avatarSrc?: string = undefined

  @property({ type: Boolean }) public isProfileName = false

  @property() public address = ''

  @property() public icon: IconType = 'chevronBottom'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button ontouchstart data-testid="wui-profile-button">
      <wui-flex gap="xs" alignItems="center">
        <wui-avatar
          .imageSrc=${this.avatarSrc}
          alt=${this.address}
          address=${this.address}
        ></wui-avatar>
        ${this.networkImageTemplate()}
        <wui-flex gap="xs" alignItems="center">
          <wui-text variant="large-600" color="fg-100">
            ${UiHelperUtil.getTruncateString({
              string: this.address,
              charsStart: this.isProfileName ? 18 : 4,
              charsEnd: this.isProfileName ? 0 : 4,
              truncate: this.isProfileName ? 'end' : 'middle'
            })}
          </wui-text>
          <wui-icon size="sm" color="fg-200" name=${this.icon}></wui-icon>
        </wui-flex>
      </wui-flex>
    </button>`
  }

  // -- Private ------------------------------------------- //
  private networkImageTemplate() {
    if (this.networkSrc) {
      return html`<wui-image src=${this.networkSrc}></wui-image>`
    }

    return html`
      <wui-icon-box
        size="xxs"
        iconColor="fg-200"
        backgroundColor="bg-100"
        icon="networkPlaceholder"
      ></wui-icon-box>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-profile-button': WuiProfileButton
  }
}
