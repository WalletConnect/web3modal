// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import '../src/composites/wui-icon-button/index.js'
import type { WuiIconButton } from '../src/composites/wui-icon-button/index.js'

// -- Helpers ------------------------------------------------------------------
async function render(label?: string) {
  const element = document.createElement('wui-icon-button') as WuiIconButton
  if (label) {
    element.label = label
  }
  document.body.appendChild(element)
  await element.updateComplete

  return element
}

// -- Tests --------------------------------------------------------------------
describe('wui-icon-button', () => {
  it('forwards label to the inner button as its accessible name', async () => {
    const element = await render('Close')
    const button = element.shadowRoot?.querySelector('button')

    expect(button?.getAttribute('aria-label')).toBe('Close')
  })

  it('renders no aria-label when no label is given', async () => {
    const element = await render()
    const button = element.shadowRoot?.querySelector('button')

    expect(button?.hasAttribute('aria-label')).toBe(false)
  })
})
