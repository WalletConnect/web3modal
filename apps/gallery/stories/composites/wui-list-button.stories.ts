import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/composites/wui-list-button'
import { html } from 'lit'
import '../../components/gallery-container'
import type { WuiListButton } from '@web3modal/ui'

type Component = Meta<WuiListButton>

export default {
  title: 'Composites/wui-list-button',
  args: {
    text: 'Continue with a wallet'
  }
} as Component

export const Default: Component = {
  render: args =>
    html` <gallery-container width="336">
      <wui-list-button text=${args.text}></wui-list-button>
    </gallery-container>`
}
