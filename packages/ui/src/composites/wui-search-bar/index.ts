import { html, LitElement } from 'lit'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import '../../composites/wui-input-element/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-input-text/index.js'
import type { WuiInputText } from '../wui-input-text/index.js'
import styles from './styles.js'
import { property } from 'lit/decorators.js'

@customElement('wui-search-bar')
export class WuiSearchBar extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  public inputComponentRef: Ref<WuiInputText> = createRef<WuiInputText>()

  @property({ type: String }) public placeholder = 'Search wallet'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-input-text
        ${ref(this.inputComponentRef)}
        placeholder=${this.placeholder}
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
      >
        <wui-input-element @click=${this.clearValue} icon="close"></wui-input-element>
      </wui-input-text>
    `
  }

  // -- Private ------------------------------------------- //
  private clearValue() {
    const inputComponent = this.inputComponentRef.value
    const inputElement = inputComponent?.inputElementRef.value
    if (inputElement) {
      inputElement.value = ''
      inputElement.focus()
      inputElement.dispatchEvent(new Event('input'))
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-search-bar': WuiSearchBar
  }
}
