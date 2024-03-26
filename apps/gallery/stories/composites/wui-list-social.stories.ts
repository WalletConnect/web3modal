import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/composites/wui-list-social'
import { html } from 'lit'
import '../../components/gallery-container'

import type { WuiListSocial } from '@web3modal/ui'

type Component = Meta<WuiListSocial>

export default {
  title: 'Composites/wui-list-social',
  args: {
    name: 'google',
    logo: 'google',
    align: 'left'
  },
  argTypes: {
    align: {
      options: ['left', 'center'],
      control: { type: 'select' }
    }
  }
} as Component

export const Default: Component = {
  render: args =>
    html` <gallery-container width="336">
      <wui-list-social align=${args.align} logo=${args.logo} name=${args.name}></wui-list-social>
    </gallery-container>`
}
