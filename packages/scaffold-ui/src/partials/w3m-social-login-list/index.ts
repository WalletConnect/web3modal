import {
  AccountController,
  ChainController,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  OptionsController,
  RouterController,
  SnackController
} from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
import type { SocialProvider } from '@reown/appkit-utils'
import { SocialProviderEnum } from '@reown/appkit-utils'
import { SafeLocalStorage, SafeLocalStorageKeys } from '@reown/appkit-common'

@customElement('w3m-social-login-list')
export class W3mSocialLoginList extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private popupWindow?: Window | null

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  @state() private authConnector = this.connectors.find(c => c.type === 'AUTH')

  @state() private features = OptionsController.state.features

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

    return html` <wui-flex flexDirection="column" gap="xs">
      ${socials.map(
        social =>
          html`<wui-list-social
            @click=${() => {
              this.onSocialClick(social)
            }}
            name=${social}
            logo=${social}
          ></wui-list-social>`
      )}
    </wui-flex>`
  }

  // -- Private ------------------------------------------- //
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
    'w3m-social-login-list': W3mSocialLoginList
  }
}
