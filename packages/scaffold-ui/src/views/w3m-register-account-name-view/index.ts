import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import styles from './styles.js'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import {
  CoreHelperUtil,
  SnackController,
  EnsController,
  EventsController,
  AccountController
} from '@reown/appkit-core'
import { W3mFrameRpcConstants } from '@reown/appkit-wallet'
import { ConstantsUtil } from '@reown/appkit-common'

@customElement('w3m-register-account-name-view')
export class W3mRegisterAccountNameView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private formRef: Ref<HTMLFormElement> = createRef()
  private usubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property() public errorMessage?: string

  @state() private name = ''

  @state() private error = ''

  @state() private loading = EnsController.state.loading

  @state() private suggestions = EnsController.state.suggestions

  @state() private registered = false

  @state() private profileName = AccountController.state.profileName

  public constructor() {
    super()
    this.usubscribe.push(
      ...[
        EnsController.subscribe(val => {
          this.suggestions = val.suggestions
          this.loading = val.loading
        }),
        AccountController.subscribeKey('profileName', val => {
          this.profileName = val
          if (val) {
            this.error = 'You already own a name'
          }
        })
      ]
    )
  }

  // -- Lifecycle ----------------------------------------- //
  public override firstUpdated() {
    this.formRef.value?.addEventListener('keydown', this.onEnterKey.bind(this))
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    this.usubscribe.forEach(unsub => unsub())
    this.formRef.value?.removeEventListener('keydown', this.onEnterKey.bind(this))
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="m"
        .padding=${['0', 's', 'm', 's'] as const}
      >
        <form ${ref(this.formRef)} @submit=${this.onSubmitName.bind(this)}>
          <wui-ens-input
            @inputChange=${this.onNameInputChange.bind(this)}
            .errorMessage=${this.error}
            .value=${this.name}
          >
          </wui-ens-input>
          ${this.submitButtonTemplate()}
          <input type="submit" hidden />
        </form>
        ${this.templateSuggestions()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private submitButtonTemplate() {
    const showSubmit = this.isAllowedToSubmit()

    return showSubmit
      ? html`
          <wui-icon-link
            size="sm"
            icon="chevronRight"
            iconcolor="accent-100"
            @click=${this.onSubmitName.bind(this)}
          >
          </wui-icon-link>
        `
      : null
  }

  private onDebouncedNameInputChange = CoreHelperUtil.debounce((value: string) => {
    if (EnsController.validateName(value)) {
      this.error = ''
      this.name = value
      EnsController.getSuggestions(value)
      EnsController.isNameRegistered(value).then(registered => {
        this.registered = registered
      })
    } else if (value.length < 4) {
      this.error = 'Name must be at least 4 characters long'
    } else {
      this.error = 'Can only contain letters, numbers and - characters'
    }
  })

  private onSelectSuggestion(name: string) {
    return () => {
      this.name = name
      this.registered = false
      this.requestUpdate()
    }
  }

  private onNameInputChange(event: CustomEvent<string>) {
    this.onDebouncedNameInputChange(event.detail)
  }

  private nameSuggestionTagTemplate() {
    if (this.loading) {
      return html`<wui-loading-spinner size="lg" color="fg-100"></wui-loading-spinner>`
    }

    return this.registered
      ? html`<wui-tag variant="shade" size="lg">Registered</wui-tag>`
      : html`<wui-tag variant="success" size="lg">Available</wui-tag>`
  }

  private templateSuggestions() {
    if (!this.name || this.name.length < 4 || this.error) {
      return null
    }

    const suggestions = this.registered ? this.suggestions.filter(s => s.name !== this.name) : []

    return html`<wui-flex flexDirection="column" gap="xxs" alignItems="center">
      <wui-flex
        data-testid="account-name-suggestion"
        .padding=${['m', 'm', 'm', 'm'] as const}
        justifyContent="space-between"
        class="suggestion"
        @click=${this.onSubmitName.bind(this)}
      >
        <wui-text color="fg-100" variant="paragraph-400" class="suggested-name">
          ${this.name}</wui-text
        >${this.nameSuggestionTagTemplate()}
      </wui-flex>
      ${suggestions.map(suggestion => this.availableNameTemplate(suggestion.name))}
    </wui-flex>`
  }

  private availableNameTemplate(suggestion: string) {
    return html` <wui-flex
      data-testid="account-name-suggestion"
      .padding=${['m', 'm', 'm', 'm'] as const}
      justifyContent="space-between"
      class="suggestion"
      @click=${this.onSelectSuggestion(suggestion)}
    >
      <wui-text color="fg-100" variant="paragraph-400" class="suggested-name">
        ${suggestion}
      </wui-text>
      <wui-tag variant="success" size="lg">Available</wui-tag>
    </wui-flex>`
  }

  private isAllowedToSubmit() {
    return (
      !this.loading &&
      !this.registered &&
      !this.error &&
      !this.profileName &&
      EnsController.validateName(this.name)
    )
  }

  private async onSubmitName() {
    try {
      if (!this.isAllowedToSubmit()) {
        return
      }
      const ensName = `${this.name}${ConstantsUtil.WC_NAME_SUFFIX}` as const
      EventsController.sendEvent({
        type: 'track',
        event: 'REGISTER_NAME_INITIATED',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          ensName
        }
      })
      await EnsController.registerName(ensName)
      EventsController.sendEvent({
        type: 'track',
        event: 'REGISTER_NAME_SUCCESS',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          ensName
        }
      })
    } catch (error) {
      SnackController.showError((error as Error).message)
      EventsController.sendEvent({
        type: 'track',
        event: 'REGISTER_NAME_ERROR',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          ensName: `${this.name}${ConstantsUtil.WC_NAME_SUFFIX}`,
          error: (error as Error)?.message || 'Unknown error'
        }
      })
    }
  }

  private onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.isAllowedToSubmit()) {
      this.onSubmitName()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-register-account-name-view': W3mRegisterAccountNameView
  }
}
