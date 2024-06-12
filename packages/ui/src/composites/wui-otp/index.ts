import { html, LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'
import '../../layout/wui-flex/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-input-numeric/index.js'
import { WuiInputNumeric } from '../wui-input-numeric/index.js'
import styles from './styles.js'

@customElement('wui-otp')
export class WuiOtp extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Number }) public length = 6

  @property({ type: String }) public otp = ''

  @state() values: string[] = Array.from({ length: this.length }).map(() => '')

  private numerics: WuiInputNumeric[] = []

  public override firstUpdated() {
    if (this.otp) {
      this.values = this.otp.split('')
    }
    const numericElements = this.shadowRoot?.querySelectorAll<WuiInputNumeric>('wui-input-numeric')
    if (numericElements) {
      this.numerics = Array.from(numericElements)
    }
    this.numerics[0]?.focus()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex gap="xxs" data-testid="wui-otp-input">
        ${Array.from({ length: this.length }).map(
          (_, index: number) => html`
            <wui-input-numeric
              @input=${(e: InputEvent) => this.handleInput(e, index)}
              @change=${(e: InputEvent) => this.handleChange(e, index)}
              @click=${(e: MouseEvent) => this.selectInput(e)}
              @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, index)}
              @inputChange=${() => console.log('inputChange')}
              @focus=${() => console.log('focus')}
              .disabled=${!this.shouldInputBeEnabled(index)}
              .value=${this.values[index] || ''}
            >
            </wui-input-numeric>
          `
        )}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private updateInput(element: HTMLInputElement, index: number, value: string) {
    const numeric = this.numerics[index]
    const input = element || (numeric ? this.getInputElement(numeric) : undefined)
    if (input) {
      input.value = value

      // Need to update the whole reference else lit-html won't re-render
      this.values = this.values.map((val, i) => (i === index ? value : val))
    }
  }

  private selectInput(e: MouseEvent) {
    const targetElement = e.target as HTMLElement
    if (targetElement) {
      const inputElement = this.getInputElement(targetElement)
      inputElement?.select()
    }
  }

  private handleChange(e: InputEvent, index: number) {
    console.log('wui-otp - handleChange', e, index)
  }

  private handleInput(e: InputEvent, index: number) {
    const inputElement = e.target as HTMLElement
    const input = this.getInputElement(inputElement)
    console.log('wui-otp - handleInput', e, index, input)

    if (input) {
      const inputValue = input.value
      if (e.inputType === 'insertFromPaste') {
        this.handlePaste(input, inputValue, index)
      } else {
        const isValid = UiHelperUtil.isNumber(inputValue)
        if (isValid && e.data) {
          this.updateInput(input, index, e.data)
          this.focusInputField('next', index)
        } else {
          this.updateInput(input, index, '')
        }
      }
    }
    this.dispatchInputChangeEvent()
  }

  private shouldInputBeEnabled = (index: number) => {
    const previousInputs = this.values.slice(0, index)

    return previousInputs.every(input => input !== '')
  }

  private handleKeyDown = (e: KeyboardEvent, index: number) => {
    console.log('wui-otp - handleKeyDown', e, index)
    const inputElement = e.target as HTMLElement
    const input = this.getInputElement(inputElement)
    const keyArr = ['ArrowLeft', 'ArrowRight', 'Shift', 'Delete']
    if (!input) {
      return
    }

    if (keyArr.includes(e.key)) {
      e.preventDefault()
    }

    const currentCaretPos = input.selectionStart
    switch (e.key) {
      case 'ArrowLeft':
        if (currentCaretPos) {
          input.setSelectionRange(currentCaretPos + 1, currentCaretPos + 1)
        }
        this.focusInputField('prev', index)
        break
      case 'ArrowRight':
        this.focusInputField('next', index)
        break
      case 'Shift':
        this.focusInputField('next', index)
        break
      case 'Delete':
        if (input.value === '') {
          this.focusInputField('prev', index)
        } else {
          this.updateInput(input, index, '')
        }
        break
      case 'Backspace':
        if (input.value === '') {
          this.focusInputField('prev', index)
        } else {
          this.updateInput(input, index, '')
        }
        break
      default:
    }
  }

  private handlePaste(input: HTMLInputElement, inputValue: string, index: number) {
    const value = inputValue[0]

    const isValid = value && UiHelperUtil.isNumber(value)
    if (isValid) {
      this.updateInput(input, index, value)
      const inputString = inputValue.substring(1)
      if (index + 1 < this.length && inputString.length) {
        const nextNumeric = this.numerics[index + 1]
        const nextInput = nextNumeric ? this.getInputElement(nextNumeric) : undefined
        if (nextInput) {
          this.handlePaste(nextInput, inputString, index + 1)
        }
      } else {
        this.focusInputField('next', index)
      }
    } else {
      this.updateInput(input, index, '')
    }
  }

  private focusInputField = (dir: 'next' | 'prev', index: number) => {
    if (dir === 'next') {
      const nextIndex = index + 1
      if (!this.shouldInputBeEnabled(nextIndex)) {
        return
      }
      const numeric = this.numerics[nextIndex < this.length ? nextIndex : index]
      const input = numeric ? this.getInputElement(numeric) : undefined

      if (input) {
        input.disabled = false
        input.focus()
      }
    }
    if (dir === 'prev') {
      const nextIndex = index - 1
      const numeric = this.numerics[nextIndex > -1 ? nextIndex : index]
      const input = numeric ? this.getInputElement(numeric) : undefined
      if (input) {
        input.focus()
      }
    }
  }

  private getInputElement(el: HTMLElement) {
    if (el.shadowRoot?.querySelector('input')) {
      return el.shadowRoot.querySelector('input')
    }

    return null
  }

  // -- Private ------------------------------------------- //
  private dispatchInputChangeEvent() {
    const value = this.values.join('')
    this.dispatchEvent(
      new CustomEvent('inputChange', {
        detail: value,
        bubbles: true,
        composed: true
      })
    )
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-otp': WuiOtp
  }
}
