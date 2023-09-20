import { css } from 'lit'

export default css`
  :host {
    overflow-x: hidden;
    overflow-y: auto;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    :host {
      align-items: flex-start;
    }

    ::slotted(wui-card) {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }
`
