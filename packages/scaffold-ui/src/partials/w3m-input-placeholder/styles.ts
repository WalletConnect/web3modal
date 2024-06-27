import { css } from 'lit'

export default css`
:host {
  width: 100%;
  height: 100px;
  border-radius: var(--wui-border-radius-s);
  border: 1px solid var(--wui-color-gray-glass-002);
  background-color: var(--wui-color-gray-glass-002);
  transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-lg);
  will-change: background-color;
  position: relative;
}


wui-flex {
  font-weight: var(--wui-font-weight-medium);
  display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

  .instruction {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: var(--wui-color-accent-100);
  }
`
