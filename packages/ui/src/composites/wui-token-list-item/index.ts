import { html, LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { NumberUtil } from '@web3modal/common'

@customElement('wui-token-list-item')
export class WuiTokenListItem extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  private observer = new IntersectionObserver(() => undefined)

  @property() public imageSrc?: string = undefined

  @property() public name?: string = undefined

  @property() public symbol?: string = undefined

  @property() public price?: string = undefined

  @property() public amount?: string = undefined

  @property({ type: Boolean }) public checked?: boolean = undefined

  @state() private visible = false

  @state() private imageError = false

  // -- Lifecycle ----------------------------------------- //
  constructor() {
    super()
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.visible = true
          } else {
            this.visible = false
          }
        })
      },
      { threshold: 0.1 }
    )
  }

  public override firstUpdated() {
    this.observer.observe(this)
  }

  public override disconnectedCallback() {
    this.observer.disconnect()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.visible) {
      return null
    }

    const value =
      this.amount && this.price ? NumberUtil.multiply(this.price, this.amount)?.toFixed(3) : null

    return html`
      <wui-flex alignItems="center">
        ${this.visualTemplate()}
        <wui-flex flexDirection="column" gap="3xs">
          <wui-flex justifyContent="space-between">
            <wui-text variant="paragraph-500" color="fg-100" lineClamp="1"
              >${this.name} ${this.checkedTemplate()}</wui-text
            >
            ${value
              ? html`
                  <wui-text variant="paragraph-500" color="fg-100">
                    $${UiHelperUtil.formatNumberToLocalString(value, 3)}
                  </wui-text>
                `
              : null}
          </wui-flex>
          <wui-flex justifyContent="space-between">
            <wui-text variant="small-400" color="fg-200" lineClamp="1">${this.symbol}</wui-text>
            ${this.amount
              ? html`<wui-text variant="small-400" color="fg-200">
                  ${UiHelperUtil.formatNumberToLocalString(this.amount, 4)}
                </wui-text>`
              : null}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private checkedTemplate() {
    if (!this.checked) {
      return null
    }

    return html`<wui-icon class="checkmark" name="checkmark" color="primary"></wui-icon>`
  }

  private visualTemplate() {
    if (this.imageError) {
      return html`<wui-flex class="token-item-image-placeholder">
        <wui-icon name="image" color="inherit"></wui-icon>
      </wui-flex>`
    }

    if (this.imageSrc) {
      return html`<wui-image
        width="40"
        height="40"
        src=${this.imageSrc}
        @onLoadError=${this.imageLoadError}
      ></wui-image>`
    }

    return null
  }

  private imageLoadError() {
    this.imageError = true
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-token-list-item': WuiTokenListItem
  }
}
