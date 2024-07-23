import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('wui-details-group-item')
export class WuiDetailsGroupItem extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public name = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-flex gap="xs" alignItems="center">
          <wui-text variant="paragraph-500" color="fg-200">${this.name}</wui-text>
          <slot name="suffix"></slot>
        </wui-flex>
        <wui-flex gap="xs" alignItems="center">
          <slot></slot>
        </wui-flex>
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-details-group-item': WuiDetailsGroupItem
  }
}
