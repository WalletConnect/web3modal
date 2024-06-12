import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('wui-input-numeric')
export class WuiInputNumeric extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) public disabled = false
  @property({ type: String }) public value = ''
  @property({ type: String }) public autocomplete: 'one-time-code' | undefined

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<input
      type="number"
      maxlength="1"
      inputmode="numeric"
      autofocus
      ?disabled=${this.disabled}
      value=${this.value}
      autocomplete=${ifDefined(this.autocomplete)}
    /> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-input-numeric': WuiInputNumeric
  }
}
