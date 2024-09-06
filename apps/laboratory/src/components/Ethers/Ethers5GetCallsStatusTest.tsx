import { Button, Stack, Text, Input } from '@chakra-ui/react'
import { useState } from 'react'
import {
  useWeb3ModalAccount,
  useWeb3ModalNetwork,
  useWeb3ModalProvider,
  type Provider
} from '@rerock/base/react'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { useChakraToast } from '../Toast'
import { ethers } from 'ethers5'
import { W3mFrameProvider } from '@rerock/wallet'
import { type GetCallsStatusParams } from '../../types/EIP5792'
import { EIP_5792_RPC_METHODS } from '../../utils/EIP5792Utils'

export function Ethers5GetCallsStatusTest() {
  const [isLoading, setLoading] = useState(false)
  const [batchCallId, setBatchCallId] = useState('')

  const { chainId } = useWeb3ModalNetwork()
  const { isConnected, address } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider<Provider>('eip155')

  const toast = useChakraToast()

  async function onGetCallsStatus() {
    try {
      setLoading(true)
      if (!walletProvider || !address) {
        throw Error('user is disconnected')
      }
      if (!chainId) {
        throw Error('chain not selected')
      }
      if (!batchCallId) {
        throw Error('call id not valid')
      }
      const provider = new ethers.providers.Web3Provider(walletProvider, chainId)
      const batchCallsStatus = await provider.send(EIP_5792_RPC_METHODS.WALLET_GET_CALLS_STATUS, [
        batchCallId as GetCallsStatusParams
      ])
      toast({
        title: 'Success',
        description: JSON.stringify(batchCallsStatus),
        type: 'success'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to get call status',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }
  function isGetCallsStatusSupported(): boolean {
    // We are currently checking capabilities above. We should use those capabilities instead of this check.
    if (walletProvider instanceof W3mFrameProvider) {
      return true
    }
    if (walletProvider instanceof EthereumProvider) {
      return Boolean(
        walletProvider?.signer?.session?.namespaces?.['eip155']?.methods?.includes(
          EIP_5792_RPC_METHODS.WALLET_GET_CALLS_STATUS
        )
      )
    }

    return false
  }

  if (!isConnected || !address || !walletProvider) {
    return (
      <Text fontSize="md" color="yellow">
        Wallet not connected
      </Text>
    )
  }
  if (!isGetCallsStatusSupported()) {
    return (
      <Text fontSize="md" color="yellow">
        Wallet does not support wallet_getCallsStatus rpc method
      </Text>
    )
  }

  return (
    <Stack direction={['column', 'column', 'row']}>
      <Input
        placeholder="0xf34ffa..."
        onChange={e => setBatchCallId(e.target.value)}
        value={batchCallId}
        isDisabled={isLoading}
      />
      <Button
        data-testid="get-calls-status-button"
        onClick={onGetCallsStatus}
        isDisabled={isLoading}
      >
        Get Calls Status
      </Button>
    </Stack>
  )
}
