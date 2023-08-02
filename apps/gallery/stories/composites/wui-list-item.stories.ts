import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/composites/wui-list-item'
import type { WuiListItem } from '@web3modal/ui/src/composites/wui-list-item'
import { html } from 'lit'
import '../../components/gallery-container.js'
import { accountEntryOptions, iconOptions, networkImageSrc } from '../../utils/PresetUtils.js'

type Component = Meta<WuiListItem>

export default {
  title: 'Composites/wui-list-item',
  args: {
    disabled: false,
    icon: 'swap',
    variant: 'image',
    imageSrc: networkImageSrc,
    alt: 'Ethereum',
    iconVariant: 'blue'
  },
  argTypes: {
    disabled: {
      control: { type: 'boolean' }
    },
    variant: {
      options: accountEntryOptions,
      control: { type: 'select' }
    },
    icon: {
      options: iconOptions,
      control: { type: 'select' }
    },
    iconVariant: {
      options: ['blue', 'overlay'],
      control: { type: 'select' }
    }
  }
} as Component

export const Default: Component = {
  render: args =>
    html` <gallery-container width="336">
      <wui-list-item
        variant=${args.variant}
        .icon=${args.icon}
        .imageSrc=${args.imageSrc}
        .alt=${args.alt}
        .iconVariant=${args.iconVariant}
        ?disabled=${args.disabled}
      >
        <wui-text variant="paragraph-500" color="fg-100">0.527 ETH</wui-text>
        <wui-text variant="paragraph-500" color="fg-200">607.38 USD</wui-text>
      </wui-list-item>
    </gallery-container>`
}
