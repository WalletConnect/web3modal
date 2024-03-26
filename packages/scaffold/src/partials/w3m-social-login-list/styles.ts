import { css } from 'lit'

export default css`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }

  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`
