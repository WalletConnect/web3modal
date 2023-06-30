import type { Meta } from '@storybook/web-components'
import '@web3modal/ui/src/layout/wui-flex'
import '../../components/gallery-placeholder'
import type { WuiFlex } from '@web3modal/ui/src/layout/wui-flex'
import { html } from 'lit'
import {
  flexDirectionOptions,
  flexWrapOptions,
  flexBasisOptions,
  flexGrowOptions,
  flexShrinkOptions,
  flexAlignItemsOptions,
  flexJustifyContentOptions,
  spacingOptions
} from '../../utils/PresetUtils'

type Component = Meta<WuiFlex>

export default {
  title: 'Layout/wui-flex',
  argTypes: {
    flexDirection: {
      options: flexDirectionOptions,
      control: { type: 'select' }
    },
    flexWrap: {
      options: flexWrapOptions,
      control: { type: 'select' }
    },
    flexBasis: {
      options: flexBasisOptions,
      control: { type: 'select' }
    },
    flexGrow: {
      options: flexGrowOptions,
      control: { type: 'select' }
    },
    flexShrink: {
      options: flexShrinkOptions,
      control: { type: 'select' }
    },
    alignItems: {
      options: flexAlignItemsOptions,
      control: { type: 'select' }
    },
    justifyContent: {
      options: flexJustifyContentOptions,
      control: { type: 'select' }
    },
    columnGap: {
      options: spacingOptions,
      control: { type: 'select' }
    },
    rowGap: {
      options: spacingOptions,
      control: { type: 'select' }
    },
    gap: {
      options: spacingOptions,
      control: { type: 'select' }
    }
  }
} as Component

export const Default: Component = {
  render: args =>
    html`<wui-flex
      .flexDirection=${args.flexDirection}
      .flexWrap=${args.flexWrap}
      .flexBasis=${args.flexBasis}
      .flexGrow=${args.flexGrow}
      .flexShrink=${args.flexShrink}
      .alignItems=${args.alignItems}
      .justifyContent=${args.justifyContent}
      .columnGap=${args.columnGap}
      .rowGap=${args.rowGap}
      .gap=${args.gap}
    >
      <gallery-placeholder size="sm" background="green"></gallery-placeholder>
      <gallery-placeholder size="lg" background="red"></gallery-placeholder>
      <gallery-placeholder size="md" background="blue"></gallery-placeholder>
    </wui-flex>`
}
