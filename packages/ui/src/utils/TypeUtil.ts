import type { vars } from './ThemeHelperUtil.js'

export type ColorType = string

export type BackgroundColorType =
  | 'foregroundSecondary'
  | 'foregroundAccent010'
  | 'foregroundPrimary'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export type IconColorType =
  | 'inherit'
  | 'accent-primary'
  | 'accent-certified'
  | 'success'
  | 'error'
  | 'warning'
  | 'default'
  | 'inverse'

export type TextColorType =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'invert'
  | 'error'
  | 'warning'
  | 'accent-primary'

export type FontFamilyType = 'regular' | 'mono'

export type TextType =
  | 'h1-regular-mono'
  | 'h1-regular'
  | 'h1-medium'
  | 'h2-regular-mono'
  | 'h2-regular'
  | 'h2-medium'
  | 'h3-regular-mono'
  | 'h3-regular'
  | 'h3-medium'
  | 'h4-regular-mono'
  | 'h4-regular'
  | 'h4-medium'
  | 'h5-regular-mono'
  | 'h5-regular'
  | 'h5-medium'
  | 'h6-regular-mono'
  | 'h6-regular'
  | 'h6-medium'
  | 'lg-regular-mono'
  | 'lg-regular'
  | 'lg-medium'
  | 'md-regular-mono'
  | 'md-regular'
  | 'md-medium'
  | 'sm-regular-mono'
  | 'sm-regular'
  | 'sm-medium'

export type TextAlign = 'center' | 'left' | 'right'

export type LineClamp = '1' | '2'

export type SizeType = 'inherit' | 'xl' | 'lg' | 'md' | 'mdl' | 'sm' | 'xs' | 'xxs' | 'xxl'

export type SelectSize = 'lg' | 'md' | 'sm'

export type SpacingType = keyof typeof vars.spacing

export type IconSizeType = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'inherit'

export type BorderRadiusType = Exclude<SpacingType, '1xs' | 'xl' | 'xxl'> | 'xs'

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

export type TabSize = 'sm' | 'md'

export type ToastMessageVariant = 'info' | 'success' | 'warning' | 'error'

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
  | 'user'
  | 'add'
  | 'allWallets'
  | 'arrowBottomCircle'
  | 'appStore'
  | 'chromeStore'
  | 'apple'
  | 'arrowBottom'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowTop'
  | 'arrowTopRight'
  | 'arrowClockWise'
  | 'bin'
  | 'bank'
  | 'browser'
  | 'card'
  | 'checkmark'
  | 'checkmarkBold'
  | 'download'
  | 'sealCheck'
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
  | 'signOut'
  | 'discord'
  | 'dollar'
  | 'etherscan'
  | 'extension'
  | 'externalLink'
  | 'exclamationCircle'
  | 'facebook'
  | 'farcaster'
  | 'filters'
  | 'github'
  | 'google'
  | 'helpCircle'
  | 'image'
  | 'id'
  | 'lightbulb'
  | 'mail'
  | 'mobile'
  | 'more'
  | 'networkPlaceholder'
  | 'nftPlaceholder'
  | 'playStore'
  | 'plus'
  | 'power'
  | 'qrCode'
  | 'questionMark'
  | 'recycleHorizontal'
  | 'refresh'
  | 'reown'
  | 'search'
  | 'send'
  | 'spinner'
  | 'swapHorizontal'
  | 'swapVertical'
  | 'telegram'
  | 'threeDots'
  | 'ton'
  | 'tron'
  | 'twitch'
  | 'twitter'
  | 'twitterIcon'
  | 'verify'
  | 'verifyFilled'
  | 'wallet'
  | 'walletConnect'
  | 'walletConnectInvert'
  | 'walletConnectLightBrown'
  | 'walletConnectBrown'
  | 'warning'
  | 'warningCircle'
  | 'x'
  | 'info'
  | 'ethereum'
  | 'solana'
  | 'bitcoin'
  | 'infoSeal'
  | 'coins'
  | 'paperPlaneTitle'

export type IconWeightType = 'regular' | 'bold' | 'fill'

export type VisualType =
  | 'browser'
  | 'meld'
  | 'dao'
  | 'defi'
  | 'defiAlt'
  | 'eth'
  | 'google'
  | 'layers'
  | 'lightbulb'
  | 'lock'
  | 'login'
  | 'network'
  | 'nft'
  | 'noun'
  | 'onrampCard'
  | 'profile'
  | 'system'
  | 'pencil'
  | 'solana'
  | 'bitcoin'
  | 'ton'

export type VisualSize = 'sm' | 'md' | 'lg'

export type LogoType =
  | 'apple'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'google'
  | 'more'
  | 'telegram'
  | 'twitch'
  | 'x'
  | 'farcaster'

export type PlacementType = 'bottom' | 'left' | 'right' | 'top'

export type SemanticChipType = 'success' | 'error' | 'warning'

export type SemanticChipSize = 'sm' | 'md' | 'lg'

export type ChipButtonType = 'accent' | 'neutral'

export type ChipButtonSize = 'sm' | 'md' | 'lg'

export type DomainChipVariant = 'success' | 'warning' | 'error'

export type DomainChipSize = 'sm' | 'md'

export type ButtonSize = 'lg' | 'md' | 'sm'

export type ToggleSize = 'lg' | 'md' | 'sm'

export type CheckboxSize = 'lg' | 'md' | 'sm'

export type TooltipSize = 'md' | 'sm'

export type TagVariant = 'accent' | 'info' | 'success' | 'warning' | 'error' | 'certified'

export type TagSize = 'md' | 'sm'

export type IconButtonVariant = 'neutral-primary' | 'neutral-secondary' | 'accent-primary'

export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export type ButtonVariant =
  | 'accent-primary'
  | 'accent-secondary'
  | 'neutral-primary'
  | 'neutral-secondary'
  | 'error-primary'
  | 'error-secondary'
  | 'neutral-tertiary'

export type ButtonShortcutVariant = 'accent' | 'secondary'
export type ButtonLinkVariant = 'accent' | 'secondary'

export type TransactionThumbnailType = TransactionType | 'fiat' | 'unknown' | 'nft'
export type TransactionThumbnailSize = 'sm' | 'lg'

// @TODO: Remove this everywhere in the code and use TransactionThumbnailType type instead
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
  | 'swapHorizontal'
  | 'checkmark'
  | 'close'

export type CardSelectType = 'network' | 'wallet'

export type BackgroundType = 'opaque' | 'gray' | 'transparent'

export type TagType = 'accent' | 'info' | 'success' | 'warning' | 'error' | 'certified'

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
  '--w3m-font-family-mono'?: string
  '--w3m-accent'?: string
  '--w3m-color-mix'?: string
  '--w3m-color-mix-strength'?: number
  '--w3m-font-size-master'?: string
  '--w3m-border-radius-master'?: string
  '--w3m-z-index'?: number
  '--w3m-qr-color'?: string
  '--apkt-font-family'?: string
  '--apkt-font-family-mono'?: string
  '--apkt-accent'?: string
  '--apkt-color-mix'?: string
  '--apkt-color-mix-strength'?: number
  '--apkt-font-size-master'?: string
  '--apkt-border-radius-master'?: string
  '--apkt-z-index'?: number
  '--apkt-qr-color'?: string
}

export type IconBoxBorderType = 'wui-color-bg-125' | 'wui-accent-glass-010'

export type TruncateType = 'start' | 'middle' | 'end'

export type WalletGuideType = 'get-started' | 'explore'

export type TruncateOptions = {
  string: string
  charsStart: number
  charsEnd: number
  truncate: TruncateType
}

export interface TokenInfo {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  logoURI: string
  domainVersion?: string
  eip2612?: boolean
  isFoT?: boolean
  tags?: string[]
}

export type MaskInputOptions = {
  value: string
  decimals?: number
  integers?: number
}

export type PulseVariant = 'accent-primary'
