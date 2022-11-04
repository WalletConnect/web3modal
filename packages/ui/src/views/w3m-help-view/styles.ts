import { css } from 'lit'

export default css`
  .w3m-footer-actions {
    display: flex;
    justify-content: center;
  }

  .w3m-footer-actions w3m-button {
    margin: 0 5px;
  }

  .w3m-info-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
  }

  .w3m-info-container:last-child {
    margin-bottom: 0;
  }

  .w3m-info-text {
    margin-top: 5px;
  }

  .w3m-images svg {
    margin: 0 2px 5px;
    width: 55px;
    height: 55px;
  }
`
