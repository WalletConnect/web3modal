import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/composites/wui-list-item'
import type { WuiTokenListItem } from '@web3modal/ui/src/composites/wui-token-list-item'
import { html } from 'lit'
import '../../components/gallery-container'
import { networkImageSrc } from '../../utils/PresetUtils'

type Component = Meta<WuiTokenListItem>

export default {
  title: 'Composites/wui-token-list-item',
  args: {
    name: 'Ethereum',
    symbol: 'ETH',
    price: '1740.72',
    amount: '0.867',
    imageSrc: networkImageSrc
  },
  argTypes: {}
} as Component

export const Default: Component = {
  render: args =>
    html`<gallery-container width="336">
      <wui-token-list-item
        name=${args.name}
        symbol=${args.symbol}
        price=${args.price}
        amount=${args.amount}
        .imageSrc=${args.imageSrc}
      >
      </wui-token-list-item>
    </gallery-container>`
}
