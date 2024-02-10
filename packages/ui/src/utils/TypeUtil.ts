export type ColorType =
  | 'accent-100'
  | 'error-100'
  | 'fg-100'
  | 'fg-200'
  | 'fg-250'
  | 'fg-300'
  | 'inherit'
  | 'inverse-000'
  | 'inverse-100'
  | 'success-100'
  | 'glass-005'

export type TextType =
  | 'large-500'
  | 'large-600'
  | 'large-700'
  | 'medium-title-600'
  | 'micro-600'
  | 'micro-700'
  | 'paragraph-400'
  | 'paragraph-500'
  | 'paragraph-600'
  | 'paragraph-700'
  | 'small-400'
  | 'small-500'
  | 'small-600'
  | 'tiny-400'
  | 'tiny-500'
  | 'tiny-600'
  | '2xl-500'

export type TextAlign = 'center' | 'left' | 'right'

export type SizeType = 'inherit' | 'xl' | 'lg' | 'md' | 'mdl' | 'sm' | 'xs' | 'xxs'

export type SpacingType =
  | '0'
  | '1xs'
  | '2xl'
  | '3xl'
  | '4xl'
  | '3xs'
  | '4xs'
  | 'l'
  | '2l'
  | 'm'
  | 's'
  | 'xl'
  | 'xs'
  | 'xxl'
  | 'xxs'

export type BorderRadiusType = Exclude<SpacingType, 'xl' | 'xxl'>

export type FlexDirectionType = 'column-reverse' | 'column' | 'row-reverse' | 'row'

export type FlexWrapType = 'nowrap' | 'wrap-reverse' | 'wrap'

export type FlexBasisType = 'auto' | 'content' | 'fit-content' | 'max-content' | 'min-content'

export type FlexGrowType = '0' | '1'

export type FlexShrinkType = '0' | '1'

export type FlexAlignItemsType = 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'stretch'

export type FlexJustifyContentType =
  | 'center'
  | 'flex-end'
  | 'flex-start'
  | 'space-around'
  | 'space-between'
  | 'space-evenly'

export interface IWalletImage {
  src: string
  walletName?: string
}

export type GridContentType =
  | 'center'
  | 'end'
  | 'space-around'
  | 'space-between'
  | 'space-evenly'
  | 'start'
  | 'stretch'

export type GridItemsType = 'center' | 'end' | 'start' | 'stretch'

export type IconType =
  | 'add'
  | 'allWallets'
  | 'arrowBottomCircle'
  | 'alpha'
  | 'appStore'
  | 'chromeStore'
  | 'apple'
  | 'arrowBottom'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowTop'
  | 'bank'
  | 'browser'
  | 'card'
  | 'checkmark'
  | 'chevronBottom'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronTop'
  | 'clock'
  | 'close'
  | 'coinPlaceholder'
  | 'compass'
  | 'copy'
  | 'cursor'
  | 'desktop'
  | 'disconnect'
  | 'discord'
  | 'etherscan'
  | 'extension'
  | 'externalLink'
  | 'facebook'
  | 'filters'
  | 'github'
  | 'google'
  | 'helpCircle'
  | 'infoCircle'
  | 'mail'
  | 'mobile'
  | 'more'
  | 'networkPlaceholder'
  | 'nftPlaceholder'
  | 'off'
  | 'playStore'
  | 'plus'
  | 'qrCode'
  | 'recycleHorizontal'
  | 'refresh'
  | 'search'
  | 'send'
  | 'swapHorizontal'
  | 'swapHorizontalBold'
  | 'swapHorizontalMedium'
  | 'swapVertical'
  | 'telegram'
  | 'twitch'
  | 'twitterIcon'
  | 'verify'
  | 'verifyFilled'
  | 'wallet'
  | 'walletConnect'
  | 'walletPlaceholder'
  | 'warningCircle'
  | 'x'

export type VisualType =
  | 'browser'
  | 'coinbase'
  | 'dao'
  | 'defi'
  | 'defiAlt'
  | 'eth'
  | 'layers'
  | 'lock'
  | 'login'
  | 'network'
  | 'nft'
  | 'noun'
  | 'onrampCard'
  | 'profile'
  | 'system'
  | 'moonpay'
  | 'stripe'
  | 'paypal'

export type VisualSize = 'sm' | 'md' | 'lg'

export type LogoType =
  | 'apple'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'google'
  | 'telegram'
  | 'twitch'
  | 'x'
  | 'more'

export type PlacementType = 'bottom' | 'left' | 'right' | 'top'

export type ChipType = 'fill' | 'shade' | 'shadeSmall' | 'transparent' | 'success'

export type ButtonType = 'accent' | 'fill' | 'shade' | 'fullWidth' | 'accentBg'

export type TransactionType =
  | 'approve'
  | 'bought'
  | 'borrow'
  | 'burn'
  | 'cancel'
  | 'claim'
  | 'deploy'
  | 'deposit'
  | 'execute'
  | 'mint'
  | 'receive'
  | 'repay'
  | 'send'
  | 'stake'
  | 'trade'
  | 'unstake'
  | 'withdraw'

// eslint-disable-next-line no-shadow
export enum TransactionTypePastTense {
  'approve' = 'approved',
  'bought' = 'bought',
  'borrow' = 'borrowed',
  'burn' = 'burnt',
  'cancel' = 'canceled',
  'claim' = 'claimed',
  'deploy' = 'deployed',
  'deposit' = 'deposited',
  'execute' = 'executed',
  'mint' = 'minted',
  'receive' = 'received',
  'repay' = 'repaid',
  'send' = 'sent',
  'sell' = 'sold',
  'stake' = 'staked',
  'trade' = 'swapped',
  'unstake' = 'unstaked',
  'withdraw' = 'withdrawn'
}

export type TransactionIconType =
  | 'arrowBottom'
  | 'arrowTop'
  | 'swapVertical'
  | 'swapHorizontalBold'
  | 'checkmark'
  | 'close'

export type CardSelectType = 'network' | 'wallet'

export type BackgroundType = 'opaque' | 'gray' | 'transparent'

export type TagType = 'main' | 'shade' | 'error' | 'success'

export type AccountEntryType = 'icon' | 'image'

export type ThemeType = 'dark' | 'light'

export type InputType =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'

export interface ThemeVariables {
  '--w3m-font-family'?: string
  '--w3m-accent'?: string
  '--w3m-color-mix'?: string
  '--w3m-color-mix-strength'?: number
  '--w3m-font-size-master'?: string
  '--w3m-border-radius-master'?: string
  '--w3m-z-index'?: number
}

export type IconBoxBorderType = 'wui-color-bg-125' | 'wui-accent-glass-010'

export type TruncateType = 'start' | 'middle' | 'end'

export type TruncateOptions = {
  string: string
  charsStart: number
  charsEnd: number
  truncate: TruncateType
}
