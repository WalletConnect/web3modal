import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/composites/wui-button'
import type { WuiButton } from '@web3modal/ui/src/composites/wui-button'
import type { IconType } from '@web3modal/ui/src/utils/TypesUtil'
import { html } from 'lit'
import { buttonOptions, iconOptions } from '../../utils/PresetUtils'

type Component = Meta<WuiButton & { iconLeft?: IconType; iconRight?: IconType }>

export default {
  title: 'Composites/wui-button',
  args: {
    size: 'md',
    variant: 'fill',
    disabled: false,
    fullWidth: false,
    iconLeft: undefined,
    iconRight: undefined,
    loading: false
  },
  argTypes: {
    size: {
      options: ['xs', 'sm', 'md', 'lg'],
      control: { type: 'select' }
    },
    variant: {
      options: buttonOptions,
      control: { type: 'select' }
    },
    fullWidth: {
      control: { type: 'boolean' }
    },
    disabled: {
      control: { type: 'boolean' }
    },
    loading: {
      control: { type: 'boolean' }
    },
    iconLeft: {
      options: [undefined, ...iconOptions],
      control: { type: 'select' }
    },
    iconRight: {
      options: [undefined, ...iconOptions],
      control: { type: 'select' }
    }
  }
} as Component

export const Default: Component = {
  render: args =>
    html`<wui-button
      size=${args.size}
      ?loading=${args.loading}
      ?disabled=${args.disabled}
      ?fullWidth=${args.fullWidth}
      variant=${args.variant}
    >
      ${args.iconLeft
        ? html`<wui-icon
            size="sm"
            color="inherit"
            name=${args.iconLeft}
            slot="iconLeft"
          ></wui-icon>`
        : null}
      Button
      ${args.iconRight
        ? html`<wui-icon
            size="sm"
            color="inherit"
            name=${args.iconRight}
            slot="iconRight"
          ></wui-icon>`
        : null}
    </wui-button>`
}
