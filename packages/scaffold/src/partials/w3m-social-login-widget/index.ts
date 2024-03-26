import {
  ConnectorController,
  RouterController,
  SnackController,
  type SocialProvider
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import styles from './styles.js'
import { ifDefined } from 'lit/directives/if-defined.js'

const MAX_TOP_VIEW = 2
const MAXIMUM_LENGTH = 6

@customElement('w3m-social-login-widget')
export class W3mSocialLoginWidget extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  private connector = this.connectors.find(c => c.type === 'AUTH')

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => {
        this.connectors = val
        this.connector = this.connectors.find(c => c.type === 'AUTH')
      })
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.connector?.socials) {
      return null
    }

    return html`
      <wui-flex flexDirection="column" gap="xs">
        ${this.topViewTemplate()}${this.bottomViewTemplate()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>
    `
  }

  // -- Private ------------------------------------------- //
  private topViewTemplate() {
    if (!this.connector?.socials) {
      return null
    }

    if (this.connector.socials.length === 2) {
      return html` <wui-flex gap="xs">
        ${this.connector.socials
          .slice(0, MAX_TOP_VIEW)
          .map(social => html`<wui-logo-select logo=${social}></wui-logo-select>`)}
      </wui-flex>`
    }

    return html` <wui-list-social
      @click=${() => {
        this.onSocialClick(this.connector?.socials?.[0])
      }}
      logo=${ifDefined(this.connector.socials[0])}
      align="center"
      name=${`Continue with ${this.connector.socials[0]}`}
    ></wui-list-social>`
  }

  private bottomViewTemplate() {
    if (!this.connector?.socials) {
      return null
    }

    if (this.connector?.socials.length < MAX_TOP_VIEW) {
      return null
    }

    if (
      this.connector?.socials.length > MAX_TOP_VIEW &&
      this.connector?.socials.length > MAXIMUM_LENGTH
    ) {
      return html`<wui-flex gap="xs">
        ${this.connector.socials
          .slice(1, MAXIMUM_LENGTH - 1)
          .map(social => html`<wui-logo-select logo=${social}></wui-logo-select>`)}
        <wui-logo-select logo="more" @click=${this.onMoreSocialsClick.bind(this)}></wui-logo-select>
      </wui-flex>`
    }

    return html`<wui-flex gap="xs">
      ${this.connector.socials
        .slice(1, this.connector.socials.length)
        .map(social => html`<wui-logo-select logo=${social}></wui-logo-select>`)}
    </wui-flex>`
  }

  // -- Private Methods ----------------------------------- //
  onMoreSocialsClick() {
    RouterController.push('ConnectSocials')
  }

  onSocialClick(socialProvider?: SocialProvider) {
    const authConnector = ConnectorController.getAuthConnector()
    try {
      if (authConnector && socialProvider) {
        authConnector.provider.connectSocial({ provider: socialProvider })
      }
    } catch (error) {
      SnackController.showError('Something went wrong')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-social-login-widget': W3mSocialLoginWidget
  }
}
