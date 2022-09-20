import { css, html } from 'lit'
import { color } from '../../utils/Theme'
import { MOBILE_BREAKPOINT } from '../../utils/UiHelpers'

export default css`
  .w3m-modal-overlay {
    inset: 0;
    position: fixed;
    z-index: 10001;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    opacity: 0;
    pointer-events: none;
  }

  .w3m-modal-open {
    pointer-events: auto;
  }

  .w3m-modal-container {
    position: relative;
    max-width: 400px;
    width: 100%;
  }

  .w3m-modal-card {
    width: 100%;
    position: relative;
    transform: translateX(5px) translateY(5px);
    border-radius: 40px;
    overflow: hidden;
    box-shadow: 0px 6px 14px -6px rgba(10, 16, 31, 0.12), 0px 10px 32px -4px rgba(10, 16, 31, 0.1);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    .w3m-modal-container {
      max-width: 440px;
    }

    .w3m-modal-card {
      transform: translateX(0) translateY(5px);
      border-radius: 40px 40px 0 0;
    }

    .w3m-modal-overlay {
      align-items: flex-end;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    .w3m-modal-container {
      max-width: 440px;
    }

    .w3m-modal-card {
      transform: translateX(0) translateY(5px);
      border-radius: 40px 40px 0 0;
    }

    .w3m-modal-overlay {
      align-items: flex-end;
    }
  }
`

export function dynamicStyles() {
  const { overlay, background, foreground } = color()

  return html`<style>
    .w3m-modal-card {
      box-shadow: 0 0 0 1px ${overlay.thin};
      background-color: ${background[1]};
      color: ${foreground[1]};
    }
  </style>`
}
