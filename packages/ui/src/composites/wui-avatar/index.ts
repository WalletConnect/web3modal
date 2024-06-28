import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../components/wui-image/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'
import type { SizeType } from '../../utils/TypeUtil.js'

@customElement('wui-avatar')
export class WuiAvatar extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc?: string = undefined

  @property() public alt?: string = undefined

  @property() public address?: string = undefined

  @property() public size?: SizeType = 'xl'

  // -- Render -------------------------------------------- //
  public override render() {
    this.style.cssText = `
    --local-width: var(--wui-icon-box-size-${this.size});
    --local-height: var(--wui-icon-box-size-${this.size});
    `

    return html`${this.visualTemplate()}`
  }

  // -- Private ------------------------------------------- //
  public visualTemplate() {
    if (this.imageSrc) {
      this.dataset['variant'] = 'image'

      return html`<wui-image src=${this.imageSrc} alt=${this.alt ?? 'avatar'}></wui-image>`
    } else if (this.address) {
      this.dataset['variant'] = 'generated'
      const cssColors = UiHelperUtil.generateAvatarColors(this.address)
      this.style.cssText += `\n ${cssColors}`

      return null
    }
    this.dataset['variant'] = 'default'

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-avatar': WuiAvatar
  }
}
