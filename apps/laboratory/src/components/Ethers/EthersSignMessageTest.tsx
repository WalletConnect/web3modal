import { Button } from '@chakra-ui/react'
import { useState } from 'react'
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/base/react'
import { BrowserProvider, JsonRpcSigner, type Eip1193Provider } from 'ethers'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { useChakraToast } from '../Toast'

export function EthersSignMessageTest() {
  const toast = useChakraToast()
  const { address } = useWeb3ModalAccount()
  const { walletProviders } = useWeb3ModalProvider<Eip1193Provider>()
  const [signature, setSignature] = useState<string | undefined>()

  async function onSignMessage() {
    try {
      if (!walletProviders['eip155'] || !address) {
        throw Error('user is disconnected')
      }

      const provider = new BrowserProvider(walletProviders['eip155'], 1)
      const signer = new JsonRpcSigner(provider, address)
      const sig = await signer?.signMessage('Hello AppKit!')
      setSignature(sig)
      toast({
        title: ConstantsUtil.SigningSucceededToastTitle,
        description: signature,
        type: 'success'
      })
    } catch (error) {
      toast({
        title: ConstantsUtil.SigningFailedToastTitle,
        description: 'Failed to sign message',
        type: 'error'
      })
    }
  }

  return (
    <>
      <Button data-testid="sign-message-button" onClick={onSignMessage} width="auto">
        Sign Message
      </Button>
      <div data-testid="w3m-signature" hidden>
        {signature}
      </div>
    </>
  )
}
