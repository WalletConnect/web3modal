import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import '../../components/wui-icon/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IconButtonSize, IconSizeType, IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('wui-icon-button')
export class WuiIconButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() icon: IconType = 'card'

  @property() variant: 'primary' | 'secondary' = 'primary'

  @property() type: 'accent' | 'neutral' | 'success' | 'error' = 'accent'

  @property() public size: IconButtonSize = 'md'

  @property() public iconSize?: IconSizeType = undefined

  @property({ type: Boolean }) public fullWidth = false

  @property({ type: Boolean }) public disabled = false

  /** Accessible name for the icon-only button, rendered as aria-label on the inner button */
  @property() public label?: string = undefined

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button
      data-variant=${this.variant}
      data-type=${this.type}
      data-size=${this.size}
      data-full-width=${this.fullWidth}
      ?disabled=${this.disabled}
      aria-label=${ifDefined(this.label)}
    >
      <wui-icon color="inherit" name=${this.icon} size=${ifDefined(this.iconSize)}></wui-icon>
    </button>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-icon-button': WuiIconButton
  }
}
