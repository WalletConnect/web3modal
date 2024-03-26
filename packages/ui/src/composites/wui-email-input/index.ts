import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-icon/index.js'
import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-input-text/index.js'
import styles from './styles.js'

@customElement('wui-email-input')
export class WuiEmailInput extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public errorMessage?: string

  @property({ type: Boolean }) public disabled = false

  @property() public value?: string

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-input-text
        placeholder="Email"
        icon="mail"
        size="mdl"
        .disabled=${this.disabled}
        .value=${this.value}
        data-testid="wui-email-input"
      ></wui-input-text>
      ${this.templateError()}
    `
  }

  // -- Private ------------------------------------------- //
  private templateError() {
    if (this.errorMessage) {
      return html`<wui-text variant="tiny-500" color="error-100">${this.errorMessage}</wui-text>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-email-input': WuiEmailInput
  }
}
