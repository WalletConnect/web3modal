import type { WuiCard } from '../components/wui-card/index.js'
import type { WuiIcon } from '../components/wui-icon/index.js'
import type { WuiImage } from '../components/wui-image/index.js'
import type { WuiLoadingHexagon } from '../components/wui-loading-hexagon/index.js'
import type { WuiLoadingSpinner } from '../components/wui-loading-spinner/index.js'
import type { WuiLoadingThumbnail } from '../components/wui-loading-thumbnail/index.js'
import type { WuiShimmer } from '../components/wui-shimmer/index.js'
import type { WuiText } from '../components/wui-text/index.js'
import type { WuiVisual } from '../components/wui-visual/index.js'

import type { WuiAccountButton } from '../composites/wui-account-button/index.js'
import type { WuiAllWalletsImage } from '../composites/wui-all-wallets-image/index.js'
import type { WuiAvatar } from '../composites/wui-avatar/index.js'
import type { WuiButton } from '../composites/wui-button/index.js'
import type { WuiCardSelectLoader } from '../composites/wui-card-select-loader/index.js'
import type { WuiCardSelect } from '../composites/wui-card-select/index.js'
import type { WuiChip } from '../composites/wui-chip/index.js'
import type { WuiConnectButton } from '../composites/wui-connect-button/index.js'
import type { WuiCtaButton } from '../composites/wui-cta-button/index.js'
import type { WuiEmailInput } from '../composites/wui-email-input/index.js'
import type { WuiIconBox } from '../composites/wui-icon-box/index.js'
import type { WuiIconLink } from '../composites/wui-icon-link/index.js'
import type { WuiInputElement } from '../composites/wui-input-element/index.js'
import type { WuiInputNumeric } from '../composites/wui-input-numeric/index.js'
import type { WuiInputText } from '../composites/wui-input-text/index.js'
import type { WuiLink } from '../composites/wui-link/index.js'
import type { WuiListItem } from '../composites/wui-list-item/index.js'
import type { WuiTransactionListItem } from '../composites/wui-transaction-list-item/index.js'
import type { WuiTransactionListItemLoader } from '../composites/wui-transaction-list-item-loader/index.js'
import type { WuiListWallet } from '../composites/wui-list-wallet/index.js'
import type { WuiLogoSelect } from '../composites/wui-logo-select/index.js'
import type { WuiLogo } from '../composites/wui-logo/index.js'
import type { WuiNetworkButton } from '../composites/wui-network-button/index.js'
import type { WuiNetworkImage } from '../composites/wui-network-image/index.js'
import type { WuiOtp } from '../composites/wui-otp/index.js'
import type { WuiQrCode } from '../composites/wui-qr-code/index.js'
import type { WuiSearchBar } from '../composites/wui-search-bar/index.js'
import type { WuiSnackbar } from '../composites/wui-snackbar/index.js'
import type { WuiTabs } from '../composites/wui-tabs/index.js'
import type { WuiTag } from '../composites/wui-tag/index.js'
import type { WuiTooltip } from '../composites/wui-tooltip/index.js'
import type { WuiTransactionVisual } from '../composites/wui-transaction-visual/index.js'
import type { WuiVisualThumbnail } from '../composites/wui-visual-thumbnail/index.js'
import type { WuiWalletImage } from '../composites/wui-wallet-image/index.js'
import type { WuiNoticeCard } from '../composites/wui-notice-card/index.js'
import type { WuiListAccordion } from '../composites/wui-list-accordion/index.js'
import type { WuiListContent } from '../composites/wui-list-content/index.js'
import type { WuiListNetwork } from '../composites/wui-list-network/index.js'
import type { WuiListWalletTransaction } from '../composites/wui-list-wallet-transaction/index.js'
import type { WuiOnRampActivityItem } from '../composites/wui-onramp-activity-item/index.js'
import type { WuiOnRampProviderItem } from '../composites/wui-onramp-provider-item/index.js'
import type { WuiListButton } from '../composites/wui-list-button/index.js'
import type { WuiListSocial } from '../composites/wui-list-social/index.js'

import type { WuiFlex } from '../layout/wui-flex/index.js'
import type { WuiGrid } from '../layout/wui-grid/index.js'
import type { WuiSeparator } from '../layout/wui-separator/index.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomElement<E> = Partial<E & { children?: any; onClick: any }>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wui-card': CustomElement<WuiCard>
      'wui-icon': CustomElement<WuiIcon>
      'wui-image': CustomElement<WuiImage>
      'wui-loading-hexagon': CustomElement<WuiLoadingHexagon>
      'wui-loading-spinner': CustomElement<WuiLoadingSpinner>
      'wui-loading-thumbnail': CustomElement<WuiLoadingThumbnail>
      'wui-shimmer': CustomElement<WuiShimmer>
      'wui-text': CustomElement<WuiText>
      'wui-visual': CustomElement<WuiVisual>
      'wui-account-button': CustomElement<WuiAccountButton>
      'wui-all-wallets-image': CustomElement<WuiAllWalletsImage>
      'wui-avatar': CustomElement<WuiAvatar>
      'wui-button': CustomElement<WuiButton>
      'wui-card-select-loader': CustomElement<WuiCardSelectLoader>
      'wui-card-select': CustomElement<WuiCardSelect>
      'wui-chip': CustomElement<WuiChip>
      'wui-connect-button': CustomElement<WuiConnectButton>
      'wui-cta-button': CustomElement<WuiCtaButton>
      'wui-email-input': CustomElement<WuiEmailInput>
      'wui-icon-box': CustomElement<WuiIconBox>
      'wui-icon-link': CustomElement<WuiIconLink>
      'wui-input-element': CustomElement<WuiInputElement>
      'wui-input-numeric': CustomElement<WuiInputNumeric>
      'wui-input-text': CustomElement<WuiInputText>
      'wui-link': CustomElement<WuiLink>
      'wui-list-item': CustomElement<WuiListItem>
      'wui-transaction-list-item': CustomElement<WuiTransactionListItem>
      'wui-transaction-list-item-loader': CustomElement<WuiTransactionListItemLoader>
      'wui-list-wallet': CustomElement<WuiListWallet>
      'wui-logo-select': CustomElement<WuiLogoSelect>
      'wui-logo': CustomElement<WuiLogo>
      'wui-network-button': CustomElement<WuiNetworkButton>
      'wui-network-image': CustomElement<WuiNetworkImage>
      'wui-otp': CustomElement<WuiOtp>
      'wui-qr-code': CustomElement<WuiQrCode>
      'wui-search-bar': CustomElement<WuiSearchBar>
      'wui-snackbar': CustomElement<WuiSnackbar>
      'wui-tabs': CustomElement<WuiTabs>
      'wui-tag': CustomElement<WuiTag>
      'wui-tooltip': CustomElement<WuiTooltip>
      'wui-transaction-visual': CustomElement<WuiTransactionVisual>
      'wui-visual-thumbnail': CustomElement<WuiVisualThumbnail>
      'wui-wallet-image': CustomElement<WuiWalletImage>
      'wui-flex': CustomElement<WuiFlex>
      'wui-grid': CustomElement<WuiGrid>
      'wui-separator': CustomElement<WuiSeparator>
      'wui-notice-card': CustomElement<WuiNoticeCard>
      'wui-list-accordion': CustomElement<WuiListAccordion>
      'wui-list-content': CustomElement<WuiListContent>
      'wui-list-network': CustomElement<WuiListNetwork>
      'wui-list-wallet-transaction': CustomElement<WuiListWalletTransaction>
      'wui-onramp-activity-item': CustomElement<WuiOnRampActivityItem>
      'wui-onramp-provider-item': CustomElement<WuiOnRampProviderItem>
      'wui-list-button': CustomElement<WuiListButton>
      'wui-list-social': CustomElement<WuiListSocial>
    }
  }
}
