import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/composites/wui-icon-link'
import type { WuiIconLink } from '@web3modal/ui/src/composites/wui-icon-link'
import { html } from 'lit'
import { iconOptions } from '../../utils/PresetUtils'

type Component = Meta<WuiIconLink>

export default {
  title: 'Composites/wui-icon-link',
  args: {
    size: 'md',
    disabled: false,
    icon: 'copy'
  },

  argTypes: {
    size: {
      defaultValue: 'md',
      options: ['sm', 'md', 'lg'],
      control: { type: 'select' }
    },
    disabled: {
      control: { type: 'boolean' }
    },
    icon: {
      options: iconOptions,
      control: { type: 'select' }
    }
  }
} as Component

export const Default: Component = {
  render: args =>
    html`<wui-icon-link
      ?disabled=${args.disabled}
      size=${args.size}
      icon=${args.icon}
    ></wui-icon-link>`
}
