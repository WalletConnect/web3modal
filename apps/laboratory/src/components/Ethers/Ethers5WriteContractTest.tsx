import { Button, Stack, Link, Text, Spacer } from '@chakra-ui/react'
import {
  useWeb3ModalAccount,
  useWeb3ModalNetwork,
  useWeb3ModalProvider,
  type Provider
} from '@rerock/appkit/react'
import { ethers } from 'ethers5'
import { optimism, sepolia } from '@rerock/appkit/chains'
import { useState } from 'react'

import { abi, address as donutAddress } from '../../utils/DonutContract'
import { useChakraToast } from '../Toast'

export function Ethers5WriteContractTest() {
  const [loading, setLoading] = useState(false)

  const toast = useChakraToast()
  const { address } = useWeb3ModalAccount()
  const { chainId } = useWeb3ModalNetwork()
  const { walletProvider } = useWeb3ModalProvider<Provider>('eip155')

  async function onSendTransaction() {
    try {
      setLoading(true)
      if (!walletProvider || !address) {
        throw Error('user is disconnected')
      }
      const provider = new ethers.providers.Web3Provider(walletProvider, chainId)
      const signer = provider.getSigner(address)
      const contract = new ethers.Contract(donutAddress, abi, signer)
      // @ts-expect-error ethers types are correct
      const tx = await contract.purchase(1, { value: ethers.parseEther('0.0001') })
      toast({
        title: 'Success',
        description: tx.hash,
        type: 'success'
      })
    } catch (e) {
      toast({
        title: 'Error',
        // @ts-expect-error - error is unknown
        description: e?.message || 'Failed to sign transaction',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }
  const allowedChains = [sepolia.chainId, optimism.chainId]

  return allowedChains.includes(Number(chainId)) && address ? (
    <Stack direction={['column', 'column', 'row']}>
      <Button
        data-testid="sign-transaction-button"
        onClick={onSendTransaction}
        isDisabled={loading}
      >
        Purchase crypto donut
      </Button>

      <Spacer />

      <Link isExternal href="https://sepoliafaucet.com">
        <Button variant="outline" colorScheme="blue" isDisabled={loading}>
          Sepolia Faucet 1
        </Button>
      </Link>

      <Link isExternal href="https://www.infura.io/faucet/sepolia">
        <Button variant="outline" colorScheme="orange" isDisabled={loading}>
          Sepolia Faucet 2
        </Button>
      </Link>
    </Stack>
  ) : (
    <Text fontSize="md" color="yellow">
      Switch to Sepolia or OP to test this feature
    </Text>
  )
}
