import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-loading-spinner/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

type Action = {
  icon: string
  label: string
  onClick: (e: Event) => void
}

@customElement('wui-dropdown-menu')
export class WuiDropdownMenu extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Array }) public actions: Action[] = []

  @property({ type: Boolean }) public isOpen = false

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.isOpen) {
      return null
    }

    return html`
      <wui-flex flexDirection="column" gap="4xs">
        ${this.actions.map(action => {
          return html`
            <wui-list-item
              icon=${action.icon}
              iconSize="sm"
              variant="icon"
              @click=${action.onClick}
            >
              <wui-text variant="small-400" color="fg-100">${action.label}</wui-text>
            </wui-list-item>
          `
        })}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-dropdown-menu': WuiDropdownMenu
  }
}
