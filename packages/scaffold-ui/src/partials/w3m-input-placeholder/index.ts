import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'

@customElement('w3m-input-placeholder')
export class W3mInputPlaceholder extends LitElement {
  public static override styles = styles
  
  // -- Render -------------------------------------------- //
  public override render() {
    return html` <wui-flex
    flexDirection="row"
    justifyContent="center"
    alignItems="center"
    gap="xxs"
    .padding=${['s', 's', 's', 's'] as const}
    class="instruction"
    > 
    <wui-icon-box
    ?border=${false}
    icon="linkConnect"
    size="s"
    backgroundColor="glass-005"
    iconColor="accent-100"
    iconSize="s"
  ></wui-icon-box
    <wui-text
      color="accent-100"
      icon="linkConnect"
    >
   
     Generate link
    </wui-text>
  </wui-flex>`
  } 
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-input-placeholder': W3mInputPlaceholder
  }
}
