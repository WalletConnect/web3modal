import { SnackController } from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'

// -- Helpers ------------------------------------------- //
const presets = {
  loading: undefined,
  success: {
    backgroundColor: 'success-100',
    iconColor: 'success-100',
    icon: 'checkmark'
  },
  error: {
    backgroundColor: 'error-100',
    iconColor: 'error-100',
    icon: 'close'
  }
} as const

@customElement('w3m-snackbar')
export class W3mSnackBar extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private timeout?: ReturnType<typeof setTimeout> = undefined

  // -- State & Properties -------------------------------- //
  @state() private open = SnackController.state.open

  public constructor() {
    super()
    this.unsubscribe.push(
      SnackController.subscribeKey('open', val => {
        this.open = val
        this.onOpen()
      })
    )
  }

  public override disconnectedCallback() {
    clearTimeout(this.timeout)
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const { message, variant } = SnackController.state
    const preset = presets[variant]

    return html`
      <wui-snackbar
        message=${message}
        backgroundColor=${preset?.backgroundColor}
        iconColor=${preset?.iconColor}
        icon=${preset?.icon}
        .loading=${variant === 'loading'}
      ></wui-snackbar>
    `
  }

  // -- Private ------------------------------------------- //
  private onOpen() {
    const { durationMs } = SnackController.state

    clearTimeout(this.timeout)
    if (this.open) {
      this.animate(
        [
          { opacity: 0, transform: 'translateX(-50%) scale(0.85)' },
          { opacity: 1, transform: 'translateX(-50%) scale(1)' }
        ],
        {
          duration: 150,
          fill: 'forwards',
          easing: 'ease'
        }
      )
      this.timeout = setTimeout(() => SnackController.hide(), durationMs)
    } else {
      this.animate(
        [
          { opacity: 1, transform: 'translateX(-50%) scale(1)' },
          { opacity: 0, transform: 'translateX(-50%) scale(0.85)' }
        ],
        {
          duration: 150,
          fill: 'forwards',
          easing: 'ease'
        }
      )
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-snackbar': W3mSnackBar
  }
}
