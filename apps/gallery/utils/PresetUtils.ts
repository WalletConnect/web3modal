import type { TransactionStatus } from '@reown/appkit-common'
import type { TransactionType } from '@reown/appkit-ui'
import type {
  AccountEntryType,
  BackgroundType,
  BorderRadiusType,
  ButtonLinkVariant,
  ButtonShortcutVariant,
  ButtonVariant,
  CardSelectType,
  ChipButtonSize,
  ChipButtonType,
  DomainChipVariant,
  FlexAlignItemsType,
  FlexBasisType,
  FlexDirectionType,
  FlexGrowType,
  FlexJustifyContentType,
  FlexShrinkType,
  FlexWrapType,
  GridContentType,
  GridItemsType,
  IconBoxBorderType,
  IconColorType,
  IconType,
  LogoType,
  PlacementType,
  SemanticChipSize,
  SemanticChipType,
  SpacingType,
  TagVariant,
  TextAlign,
  TextColorType,
  TextType,
  ThemeType,
  ToastMessageVariant,
  VisualType
} from '@reown/appkit-ui/src/utils/TypeUtil'

export const textColorOptions: TextColorType[] = [
  'primary',
  'secondary',
  'tertiary',
  'invert',
  'error',
  'warning',
  'accent-primary'
]

export const iconColorOptions: IconColorType[] = [
  'inherit',
  'accent-primary',
  'accent-certified',
  'success',
  'error',
  'warning',
  'default',
  'inverse'
]

// @TODO: Deprecate this
export const colorOptions = iconColorOptions

export const backgroundColorOptions = ['foregroundSecondary', 'foregroundAccent010']

export const textOptions: TextType[] = [
  'h1-regular-mono',
  'h1-regular',
  'h1-medium',
  'h2-regular-mono',
  'h2-regular',
  'h2-medium',
  'h3-regular-mono',
  'h3-regular',
  'h3-medium',
  'h4-regular-mono',
  'h4-regular',
  'h4-medium',
  'h5-regular-mono',
  'h5-regular',
  'h5-medium',
  'h6-regular-mono',
  'h6-regular',
  'h6-medium',
  'lg-regular-mono',
  'lg-regular',
  'lg-medium',
  'md-regular-mono',
  'md-regular',
  'md-medium',
  'sm-regular-mono',
  'sm-regular',
  'sm-medium'
]

export const textAlignOptions: TextAlign[] = ['center', 'left', 'right']

export const flexDirectionOptions: FlexDirectionType[] = [
  'column-reverse',
  'column',
  'row-reverse',
  'row'
]

export const flexWrapOptions: FlexWrapType[] = ['nowrap', 'wrap-reverse', 'wrap']

export const flexBasisOptions: FlexBasisType[] = [
  'auto',
  'content',
  'fit-content',
  'max-content',
  'min-content'
]

export const flexGrowOptions: FlexGrowType[] = ['0', '1']

export const flexShrinkOptions: FlexShrinkType[] = ['0', '1']

export const flexAlignItemsOptions: FlexAlignItemsType[] = [
  'baseline',
  'center',
  'flex-end',
  'flex-start',
  'stretch'
]

export const flexJustifyContentOptions: FlexJustifyContentType[] = [
  'center',
  'flex-end',
  'flex-start',
  'space-around',
  'space-between',
  'space-evenly'
]

export const gridContentOptions: GridContentType[] = [
  'center',
  'end',
  'space-around',
  'space-between',
  'space-evenly',
  'start',
  'stretch'
]

export const walletImagesOptions = [
  {
    src: 'https://walletguide.walletconnect.com/_next/image?url=https%3A%2F%2Fapi.web3modal.com%2Fv2%2Fwallet-image%2F200x200%2Feebe4a7f-7166-402f-92e0-1f64ca2aa800%3FprojectId%3Dad53ae497ee922ad9beb2ef78b1a7a6e%26st%3Dwallet-guide%26sv%3D1.0.0&w=384&q=75',
    walletName: 'MetaMask'
  },
  {
    src: 'https://explorer-api.walletconnect.com/w3m/v1/getWalletImage/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=c1781fc385454899a2b1385a2b83df3b',
    walletName: 'Rainbow'
  },
  {
    src: 'https://walletguide.walletconnect.com/_next/image?url=https%3A%2F%2Fapi.web3modal.com%2Fv2%2Fwallet-image%2F200x200%2F7677b54f-3486-46e2-4e37-bf8747814f00%3FprojectId%3Dad53ae497ee922ad9beb2ef78b1a7a6e%26st%3Dwallet-guide%26sv%3D1.0.0&w=384&q=75',
    walletName: 'Zerion'
  },
  {
    src: 'https://explorer-api.walletconnect.com/w3m/v1/getWalletImage/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=c1781fc385454899a2b1385a2b83df3b',
    walletName: 'Ledger'
  },
  {
    src: 'https://explorer-api.walletconnect.com/w3m/v1/getWalletImage/7e1514ba-932d-415d-1bdb-bccb6c2cbc00?projectId=c1781fc385454899a2b1385a2b83df3b',
    walletName: 'Fireblocks'
  }
]

export const walletImageSrc =
  'https://explorer-api.walletconnect.com/w3m/v1/getWalletImage/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=c1781fc385454899a2b1385a2b83df3b'

export const networkImageSrc =
  'https://api.web3modal.org/public/getAssetImage/ba0ba0cd-17c6-4806-ad93-f9d174f17900?projectId=702e2d45d9debca66795614cddb5c1ca&st=appkit&sv=react-wagmi-1.7.13'

export const networkImages = [
  'https://explorer-api.walletconnect.com/w3m/v1/getAssetImage/692ed6ba-e569-459a-556a-776476829e00?projectId=c1781fc385454899a2b1385a2b83df3b',
  'https://explorer-api.walletconnect.com/w3m/v1/getAssetImage/692ed6ba-e569-459a-556a-776476829e00?projectId=c1781fc385454899a2b1385a2b83df3b',
  'https://explorer-api.walletconnect.com/w3m/v1/getAssetImage/692ed6ba-e569-459a-556a-776476829e00?projectId=c1781fc385454899a2b1385a2b83df3b',
  'https://explorer-api.walletconnect.com/w3m/v1/getAssetImage/692ed6ba-e569-459a-556a-776476829e00?projectId=c1781fc385454899a2b1385a2b83df3b',
  'https://explorer-api.walletconnect.com/w3m/v1/getAssetImage/692ed6ba-e569-459a-556a-776476829e00?projectId=c1781fc385454899a2b1385a2b83df3b'
]

export const avatarImageSrc =
  'https://i.seadn.io/gcs/files/007a5af0d93d561f87c8d026ddd5179e.png?auto=format&dpr=1&w=1000'

export const transactionImageSrc =
  'https://uploads-ssl.webflow.com/61fe6bb74158b468a1112105/61fe8900148b6e6ee7c2c4e4_Profile%20Pic_Smoker-p-500.jpeg'

export const externalLink = 'https://www.fireblocks.com'

export const address = '0xDBbD65026a07cFbFa1aa92744E4D69951686077d'

export const gridItemsOptions: GridItemsType[] = ['center', 'end', 'start', 'stretch']

export const borderRadiusOptions: BorderRadiusType[] = ['4xs', '3xs', 'xxs', 'xs', 's', 'm', 'l']

export const spacingOptions: SpacingType[] = [
  '4xs',
  '3xs',
  'xxs',
  'xs',
  's',
  'm',
  'l',
  '2l',
  'xl',
  '3xl'
]

export const toastMessageOptions: ToastMessageVariant[] = ['info', 'success', 'warning', 'error']

export const iconOptions: IconType[] = [
  'allWallets',
  'apple',
  'arrowBottom',
  'arrowLeft',
  'arrowRight',
  'arrowTop',
  'browser',
  'card',
  'checkmark',
  'sealCheck',
  'chevronBottom',
  'chevronLeft',
  'chevronRight',
  'chevronTop',
  'clock',
  'close',
  'coinPlaceholder',
  'compass',
  'copy',
  'cursor',
  'desktop',
  'signOut',
  'discord',
  'etherscan',
  'extension',
  'externalLink',
  'facebook',
  'filters',
  'github',
  'google',
  'helpCircle',
  'mail',
  'mobile',
  'networkPlaceholder',
  'nftPlaceholder',
  'power',
  'qrCode',
  'plus',
  'refresh',
  'search',
  'swapHorizontal',
  'swapVertical',
  'telegram',
  'twitch',
  'twitterIcon',
  'twitter',
  'verify',
  'verifyFilled',
  'wallet',
  'walletConnect',
  'warningCircle'
]

export const visualOptions: VisualType[] = [
  'browser',
  'dao',
  'defi',
  'defiAlt',
  'eth',
  'layers',
  'lock',
  'login',
  'network',
  'nft',
  'noun',
  'profile',
  'system',
  'coinbase',
  'stripe',
  'moonpay',
  'paypal'
]

export const logoOptions: LogoType[] = [
  'apple',
  'discord',
  'facebook',
  'github',
  'google',
  'telegram',
  'twitch',
  'x'
]

export const placementOptions: PlacementType[] = ['top', 'right', 'bottom', 'left']

export const chipButtonTypes: ChipButtonType[] = ['accent', 'neutral']

export const chipButtonSizes: ChipButtonSize[] = ['sm', 'md', 'lg']

export const domainChipVariants: DomainChipVariant[] = ['success', 'warning', 'error']

export const semanticChipTypes: SemanticChipType[] = ['success', 'error', 'warning']

export const semanticChipSizes: SemanticChipSize[] = ['sm', 'md', 'lg']

export const buttonOptions: ButtonVariant[] = [
  'accent-primary',
  'accent-secondary',
  'neutral-primary',
  'neutral-secondary',
  'error-primary',
  'error-secondary',
  'neutral-tertiary'
]

export const buttonShortcutOptions: ButtonShortcutVariant[] = ['accent', 'secondary']

export const buttonLinkOptions: ButtonLinkVariant[] = ['accent', 'secondary']

export const transactionThumbnailOptions: TransactionType[] = [
  'approve',
  'bought',
  'borrow',
  'burn',
  'cancel',
  'claim',
  'deploy',
  'deposit',
  'execute',
  'mint',
  'receive',
  'repay',
  'send',
  'stake',
  'trade',
  'unstake',
  'withdraw'
]

export const transactionStatusOptions: TransactionStatus[] = ['confirmed', 'pending', 'failed']

export const cardSelectOptions: CardSelectType[] = ['network', 'wallet']

export const backgroundOptions: BackgroundType[] = ['opaque', 'transparent']

export const tagOptions: TagVariant[] = [
  'accent',
  'info',
  'success',
  'warning',
  'error',
  'certified'
]

export const accountEntryOptions: AccountEntryType[] = ['icon', 'image']

export const themeOptions: ThemeType[] = ['dark', 'light']

export const iconBoxBorderOptions: IconBoxBorderType[] = [
  'wui-color-bg-125',
  'wui-accent-glass-010'
]

export const signTypedData = {
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xcccccccccccccccccccccccccccccccccccccccc'
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'version',
        type: 'string'
      },
      {
        name: 'chainId',
        type: 'uint256'
      },
      {
        name: 'verifyingContract',
        type: 'address'
      }
    ],
    Person: [
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'wallet',
        type: 'address'
      }
    ],
    Mail: [
      {
        name: 'from',
        type: 'Person'
      },
      {
        name: 'to',
        type: 'Person'
      },
      {
        name: 'contents',
        type: 'string'
      }
    ]
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826'
    },
    to: {
      name: 'Bob',
      wallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    },
    contents: 'Hello, Bob!'
  }
}
