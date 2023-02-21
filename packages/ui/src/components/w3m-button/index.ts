import type { TemplateResult } from 'lit'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

@customElement('w3m-button')
export class W3mButton extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- state & properties ------------------------------------------- //
  @property() public disabled? = false
  @property() public iconLeft?: TemplateResult<2> = undefined
  @property() public iconRight?: TemplateResult<2> = undefined
  @property() public onClick: () => void = () => null

  // -- render ------------------------------------------------------- //
  protected render() {
    const classes = {
      'w3m-icon-left': this.iconLeft !== undefined,
      'w3m-icon-right': this.iconRight !== undefined
    }

    return html`
      <button class=${classMap(classes)} ?disabled=${this.disabled} @click=${this.onClick}>
        ${this.iconLeft}
        <w3m-text variant="small-regular" color="inverse">
          <slot></slot>
        </w3m-text>
        ${this.iconRight}
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-button': W3mButton
  }
}
