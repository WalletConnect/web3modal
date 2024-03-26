import { expect } from '@playwright/test'
import { ModalValidator } from './ModalValidator'

const emailAccountAddresses = [
  {
    eoa: '0xFBc2fbd18BeCb2aa5608825c286763a2E7961026',
    sa: '0x1B28bd4d53ca670914a3008272B3539fAc69b695'
  },
  {
    eoa: '0xaE9C2f4EAb6461C3a8cf90C98708f86C8F03d6b1',
    sa: '0x973417C5f2779716ef0Ce08901942f5E55Fd53Be'
  },
  {
    eoa: '0xddeFfeb0CBE465Fb5004dBbB0B4850438E6A24C7',
    sa: '0x2f42FB36107C73c932d92Da0B999aD6285ec1205'
  },
  {
    eoa: '0x2F0cdC3fa8E5D8ec05FF848062fBa839bf3aa449',
    sa: '0xdB1699bEfE8C036A3eA4883AAB043c9e912d0cbb'
  },
  {
    eoa: '0x15F7A866F3E75c948340ae80Edf63f61e1E452BD',
    sa: '0x75b96a5b6f93132eA1436251cFCCe033B82dE5F5'
  },
  {
    eoa: '0x832AC431A68359a078c28816718934a61C728e38',
    sa: '0x75AC3Cb6e8d66D57A7c11A304e8B47e95Df141E5'
  },
  {
    eoa: '0x56c4622160321EF693854701C7293924d22fAFd9',
    sa: '0xb87591Be2CC059DAe58571fD9d8d1fc5Bd903b0d'
  },
  {
    eoa: '0xaDd3324300Ef88a84cce3cA79F4f2808A41bDEF1',
    sa: '0x5906157f8A27C25351f3Bc5BAB6c12Cd83b6260e'
  },
  {
    eoa: '0xF1110102F2927B424396A35b4Eb513693E0d39E9',
    sa: '0xDEC57B621A54a13543911e8F8b6f1033ef3f94Fd'
  },
  {
    eoa: '0x2B6f7FbfD122380E91440f6d23C93b89e7079751',
    sa: '0x6710E18aEe456B47022fE7b0BaF8927f87e9dd6D'
  }
]

function formatAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-6)}`
}

export class ModalWalletValidator extends ModalValidator {
  async expectActivateSmartAccountPromo() {
    await expect(
      this.page.getByTestId('activate-smart-account-promo'),
      'Activate smart account promo should be present'
    ).toContainText('unauthenticated')
  }

  async expectSmartAccountAddress(index: number) {
    const address = this.page.getByTestId('account-settings-address')

    await expect(address, 'Smart account sepolia address should be present').toHaveText(
      formatAddress(emailAccountAddresses[index]?.sa || '')
    )
  }

  async expectEoaAddress(index: number) {
    const address = this.page.getByTestId('account-settings-address')

    await expect(address, 'EOA address should be present').toHaveText(
      formatAddress(emailAccountAddresses[index]?.eoa || '')
    )
  }
}
