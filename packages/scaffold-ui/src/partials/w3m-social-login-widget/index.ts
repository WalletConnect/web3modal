import {
  AccountController,
  ChainController,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  OptionsController,
  RouterController,
  SnackController,
  type SocialProvider,
  type WalletGuideType
} from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { state, property } from 'lit/decorators.js'

import styles from './styles.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { SocialProviderEnum } from '@reown/appkit-utils'
import { SafeLocalStorage, SafeLocalStorageKeys } from '@reown/appkit-common'

const MAX_TOP_VIEW = 2
const MAXIMUM_LENGTH = 6

@customElement('w3m-social-login-widget')
export class W3mSocialLoginWidget extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private popupWindow?: Window | null

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  @state() private features = OptionsController.state.features

  @state() private authConnector = this.connectors.find(c => c.type === 'AUTH')

  @property() public walletGuide: WalletGuideType = 'get-started'

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => {
        this.connectors = val
        this.authConnector = this.connectors.find(c => c.type === 'AUTH')
      }),
      OptionsController.subscribeKey('features', val => (this.features = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const socials = this.features?.socials

    if (!this.authConnector || !socials || !socials?.length) {
      return null
    }

    return html`
      <wui-flex
        class="container"
        flexDirection="column"
        gap="xs"
        .padding=${['0', '0', 'xs', '0'] as const}
        data-testid="w3m-social-login-widget"
      >
        ${this.topViewTemplate()}${this.bottomViewTemplate()}
      </wui-flex>
      ${this.separatorTemplate()}
    `
  }

  // -- Private ------------------------------------------- //
  private topViewTemplate() {
    const socials = this.features?.socials

    if (!this.authConnector || !socials || !socials?.length) {
      return null
    }

    if (socials.length === 2) {
      return html` <wui-flex gap="xs">
        ${socials.slice(0, MAX_TOP_VIEW).map(
          social =>
            html`<wui-logo-select
              data-testid=${`social-selector-${social}`}
              @click=${() => {
                this.onSocialClick(social)
              }}
              logo=${social}
            ></wui-logo-select>`
        )}
      </wui-flex>`
    }

    return html` <wui-list-social
      data-testid=${`social-selector-${socials?.[0]}`}
      @click=${() => {
        this.onSocialClick(socials?.[0])
      }}
      logo=${ifDefined(socials[0])}
      align="center"
      name=${`Continue with ${socials[0]}`}
    ></wui-list-social>`
  }

  private bottomViewTemplate() {
    const socials = this.features?.socials

    if (!this.authConnector || !socials || !socials?.length) {
      return null
    }

    if (socials.length <= MAX_TOP_VIEW) {
      return null
    }

    if (socials.length > MAXIMUM_LENGTH) {
      return html`<wui-flex gap="xs">
        ${socials.slice(1, MAXIMUM_LENGTH - 1).map(
          social =>
            html`<wui-logo-select
              data-testid=${`social-selector-${social}`}
              @click=${() => {
                this.onSocialClick(social)
              }}
              logo=${social}
            ></wui-logo-select>`
        )}
        <wui-logo-select logo="more" @click=${this.onMoreSocialsClick.bind(this)}></wui-logo-select>
      </wui-flex>`
    }

    return html`<wui-flex gap="xs">
      ${socials.slice(1, socials.length).map(
        social =>
          html`<wui-logo-select
            data-testid=${`social-selector-${social}`}
            @click=${() => {
              this.onSocialClick(social)
            }}
            logo=${social}
          ></wui-logo-select>`
      )}
    </wui-flex>`
  }

  private separatorTemplate() {
    const walletConnectConnector = this.connectors.find(c => c.id === 'walletConnect')
    const enableWallets = OptionsController.state.enableWallets

    if ((walletConnectConnector && enableWallets) || this.walletGuide === 'explore') {
      return html`<wui-separator text="or"></wui-separator>`
    }

    return null
  }

  // -- Private Methods ----------------------------------- //
  onMoreSocialsClick() {
    RouterController.push('ConnectSocials')
  }

  async onSocialClick(socialProvider?: SocialProvider) {
    if (socialProvider) {
      AccountController.setSocialProvider(socialProvider, ChainController.state.activeChain)

      EventsController.sendEvent({
        type: 'track',
        event: 'SOCIAL_LOGIN_STARTED',
        properties: { provider: socialProvider }
      })
    }
    if (socialProvider === SocialProviderEnum.Farcaster) {
      RouterController.push('ConnectingFarcaster')
      const authConnector = ConnectorController.getAuthConnector()

      if (authConnector) {
        if (!AccountController.state.farcasterUrl) {
          try {
            const { url } = await authConnector.provider.getFarcasterUri()

            AccountController.setFarcasterUrl(url, ChainController.state.activeChain)
          } catch (error) {
            RouterController.goBack()
            SnackController.showError(error)
          }
        }
      }
    } else {
      RouterController.push('ConnectingSocial')
      const authConnector = ConnectorController.getAuthConnector()
      if (!CoreHelperUtil.isTelegram()) {
        this.popupWindow = CoreHelperUtil.returnOpenHref(
          '',
          'popupWindow',
          'width=600,height=800,scrollbars=yes'
        )
      }
      try {
        if (authConnector && socialProvider) {
          const { uri } = await authConnector.provider.getSocialRedirectUri({
            provider: socialProvider
          })
          if (this.popupWindow && uri) {
            AccountController.setSocialWindow(this.popupWindow, ChainController.state.activeChain)
            this.popupWindow.location.href = uri
          } else if (CoreHelperUtil.isTelegram() && uri) {
            SafeLocalStorage.setItem(SafeLocalStorageKeys.SOCIAL_PROVIDER, socialProvider)
            const parsedUri = CoreHelperUtil.formatTelegramSocialLoginUrl(uri)
            CoreHelperUtil.openHref(parsedUri, '_top')
          } else {
            this.popupWindow?.close()
            throw new Error('Something went wrong')
          }
        }
      } catch (error) {
        this.popupWindow?.close()
        SnackController.showError('Something went wrong')
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-social-login-widget': W3mSocialLoginWidget
  }
}
