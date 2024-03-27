import { css } from 'lit'

export default css`
  :host > wui-flex:first-child {
    overflow-y: hidden;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  wui-loading-hexagon {
    position: absolute;
  }

  .network-list-item {
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--wui-spacing-s);
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xs);
    outline: none;
  }

  .network-list-item:hover {
    background: var(--wui-gray-glass-001);
  }

  .network-list-item:focus-visible {
    box-shadow: inset 0 0 0 2px var(--wui-gray-glass-010);
  }

  .network-list-item.active {
    background: var(--wui-gray-glass-002);
  }

  .network-list-item wui-image {
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-s);
    box-shadow: inset 0 0 0 2px var(--wui-gray-glass-010);
  }

  .network-list-item wui-icon {
    width: 14px;
    height: 14px;
  }

  .token-list {
    padding-top: var(--wui-spacing-s);
    max-height: calc(512px);
    overflow-y: auto;
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;
  }

  .network-search-input,
  .select-network-button {
    height: 40px;
  }

  .select-network-button {
    box-shadow: inset 0 0 0 1px var(--wui-gray-glass-005);
    background-color: var(--wui-gray-glass-002);
    border-radius: var(--wui-border-radius-xxs);
    padding: var(--wui-spacing-xs);
    align-items: center;
    transition: background-color 0.2s linear;
  }

  .select-network-button:hover {
    background-color: var(--wui-gray-glass-005);
  }

  .select-network-button > wui-image {
    width: 26px;
    height: 26px;
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-gray-glass-010);
  }
`
