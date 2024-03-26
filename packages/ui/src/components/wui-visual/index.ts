import type { TemplateResult } from 'lit'
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { browserSvg } from '../../assets/visual/browser.js'
import { daoSvg } from '../../assets/visual/dao.js'
import { defiSvg } from '../../assets/visual/defi.js'
import { defiAltSvg } from '../../assets/visual/defiAlt.js'
import { ethSvg } from '../../assets/visual/eth.js'
import { layersSvg } from '../../assets/visual/layers.js'
import { lockSvg } from '../../assets/visual/lock.js'
import { loginSvg } from '../../assets/visual/login.js'
import { networkSvg } from '../../assets/visual/network.js'
import { nftSvg } from '../../assets/visual/nft.js'
import { nounSvg } from '../../assets/visual/noun.js'
import { profileSvg } from '../../assets/visual/profile.js'
import { systemSvg } from '../../assets/visual/system.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import type { VisualSize, VisualType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import { coinbaseSvg } from '../../assets/visual/coinbase.js'
import { moonpaySvg } from '../../assets/visual/moonpay.js'
import { stripeSvg } from '../../assets/visual/stripe.js'
import { paypalSvg } from '../../assets/visual/paypal.js'
import { onrampCardSvg } from '../../assets/visual/onramp-card.js'
import { googleSvg } from '../../assets/visual/google.js'
import { pencilSvg } from '../../assets/visual/pencil.js'
import { lightbulbSvg } from '../../assets/visual/lightbulb.js'
import styles from './styles.js'

// -- Svg's-------------------------------- //
const svgOptions: Record<VisualType, TemplateResult<2>> = {
  browser: browserSvg,
  dao: daoSvg,
  defi: defiSvg,
  defiAlt: defiAltSvg,
  eth: ethSvg,
  layers: layersSvg,
  lock: lockSvg,
  login: loginSvg,
  network: networkSvg,
  nft: nftSvg,
  noun: nounSvg,
  profile: profileSvg,
  system: systemSvg,
  coinbase: coinbaseSvg,
  onrampCard: onrampCardSvg,
  moonpay: moonpaySvg,
  stripe: stripeSvg,
  paypal: paypalSvg,
  google: googleSvg,
  pencil: pencilSvg,
  lightbulb: lightbulbSvg
}

@customElement('wui-visual')
export class WuiVisual extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public name: VisualType = 'browser'

  @property() public size: VisualSize = 'md'

  // -- Render -------------------------------------------- //
  public override render() {
    this.style.cssText = `
       --local-size: var(--wui-visual-size-${this.size});
   `

    return html`${svgOptions[this.name]}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-visual': WuiVisual
  }
}
