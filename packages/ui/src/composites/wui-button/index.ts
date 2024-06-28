import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-icon/index.js'
import '../../components/wui-loading-spinner/index.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { BorderRadiusType, ButtonSize, ButtonVariant } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

// -- Constants ------------------------------------------ //
const SPINNER_COLOR_BY_VARIANT = {
  main: 'inverse-100',
  inverse: 'inverse-000',
  accent: 'accent-100',
  'accent-error': 'error-100',
  'accent-success': 'success-100',
  neutral: 'fg-100',
  disabled: 'gray-glass-020'
}

const TEXT_VARIANT_BY_SIZE = {
  lg: 'paragraph-600',
  md: 'small-600'
}

const SPINNER_SIZE_BY_SIZE = {
  lg: 'md',
  md: 'md'
}

// -- Component ------------------------------------------ //
@customElement('wui-button')
export class WuiButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //

  @property() public size: ButtonSize = 'lg'

  @property({ type: Boolean }) public disabled = false

  @property({ type: Boolean }) public fullWidth = false

  @property({ type: Boolean }) public loading = false

  @property() public variant: ButtonVariant = 'main'

  @property({ type: Boolean }) private hasIconLeft = false

  @property({ type: Boolean }) private hasIconRight = false

  @property() public borderRadius: Exclude<BorderRadiusType, 'inherit' | 'xxs'> = 'm'

  @property() public textVariant?: string

  // -- Render -------------------------------------------- //
  public override render() {
    this.style.cssText = `
    --local-width: ${this.fullWidth ? '100%' : 'auto'};
    --local-opacity-100: ${this.loading ? 0 : 1};
    --local-opacity-000: ${this.loading ? 1 : 0};
    --local-border-radius: var(--wui-border-radius-${this.borderRadius});
    `

    const textVariant = this.textVariant ?? TEXT_VARIANT_BY_SIZE[this.size]

    return html`
      <button
        data-variant=${this.variant}
        data-icon-left=${this.hasIconLeft}
        data-icon-right=${this.hasIconRight}
        data-size=${this.size}
        ?disabled=${this.disabled}
        ontouchstart
      >
        ${this.loadingTemplate()}
        <slot name="iconLeft" @slotchange=${() => this.handleSlotLeftChange()}></slot>
        <wui-text variant=${textVariant} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight" @slotchange=${() => this.handleSlotRightChange()}></slot>
      </button>
    `
  }

  public handleSlotLeftChange() {
    this.hasIconLeft = true
  }

  public handleSlotRightChange() {
    this.hasIconRight = true
  }

  public loadingTemplate() {
    if (this.loading) {
      const size = SPINNER_SIZE_BY_SIZE[this.size]
      const color = this.disabled
        ? SPINNER_COLOR_BY_VARIANT['disabled']
        : SPINNER_COLOR_BY_VARIANT[this.variant]

      return html`<wui-loading-spinner color=${color} size=${size}></wui-loading-spinner>`
    }

    return html``
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-button': WuiButton
  }
}
