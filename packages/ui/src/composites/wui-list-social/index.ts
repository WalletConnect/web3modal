import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-logo/index.js'
import styles from './styles.js'
import type { LogoType } from '../../utils/TypeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'

@customElement('wui-list-social')
export class WuiListSocial extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public logo: LogoType = 'google'

  @property() public name = 'Continue with google'

  @property() public align: 'left' | 'center' = 'left'

  @property({ type: Boolean }) public disabled = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button ?disabled=${this.disabled} ontouchstart>
        <wui-logo logo=${this.logo}></wui-logo>
        <wui-text data-align=${this.align} variant="paragraph-500" color="inherit"
          >${UiHelperUtil.capitalizeFirstLetter(this.name)}</wui-text
        >
        ${this.templatePlacement()}
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private templatePlacement() {
    if (this.align === 'center') {
      return html` <wui-logo class="invisible" logo=${this.logo}></wui-logo>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-list-social': WuiListSocial
  }
}
