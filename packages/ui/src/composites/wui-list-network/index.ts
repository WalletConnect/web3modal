import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-network-image/index.js'
import styles from './styles.js'

@customElement('wui-list-network')
export class WuiListNetwork extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc? = ''

  @property() public name = ''

  @property({ type: Boolean }) public disabled = false

  @property({ type: Boolean }) public selected = false

  @property({ type: Boolean }) public transparent = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button data-transparent=${this.transparent} ?disabled=${this.disabled} ontouchstart>
        <wui-flex gap="s" alignItems="center">
          ${this.templateNetworkImage()}
          <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text></wui-flex
        >
        ${this.checkmarkTemplate()}
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private checkmarkTemplate() {
    if (this.selected) {
      return html`<wui-icon size="sm" color="accent-100" name="checkmarkBold"></wui-icon>`
    }

    return null
  }

  private templateNetworkImage() {
    if (this.imageSrc) {
      return html`<wui-image size="sm" src=${this.imageSrc} name=${this.name}></wui-image>`
    }
    if (!this.imageSrc) {
      return html`<wui-network-image
        ?round=${true}
        size="md"
        name=${this.name}
      ></wui-network-image>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-list-network': WuiListNetwork
  }
}
