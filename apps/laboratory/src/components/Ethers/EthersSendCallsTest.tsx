import { Button, Stack, Text, Spacer } from '@chakra-ui/react'
import { useState } from 'react'
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { useChakraToast } from '../Toast'
import { parseGwei, type Address } from 'viem'
import { vitalikEthAddress } from '../../utils/DataUtil'
import { BrowserProvider } from 'ethers'
import { EIP_5792_RPC_METHODS, getCapabilitySupportedChainInfoForEthers } from '../../utils/EIP5792Utils'

export function EthersSendCallsTest() {
  const toast = useChakraToast()
  const { address, chainId } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()
  const ethereumProvider =
    walletProvider && (walletProvider as Awaited<ReturnType<(typeof EthereumProvider)['init']>>)
  const [loading, setLoading] = useState(false)
  async function onSendCalls() {
    try {
      setLoading(true)
      if (!walletProvider || !address) {
        throw Error('user is disconnected')
      }
      if (!chainId) {
        throw Error('chain not selected')
      }
      const provider = new BrowserProvider(walletProvider, chainId)
      const amountToSend = parseGwei('0.001').toString(16)
      const calls = [
        {
          to: vitalikEthAddress as `0x${string}`,
          data: '0x' as `0x${string}`,
          value: `0x${amountToSend}`
        },
        {
          to: vitalikEthAddress as Address,
          value: '0x00',
          data: '0xdeadbeef'
        }
      ]
      const sendCallsParams = {
        version: '1.0',
        chainId: `0x${BigInt(chainId).toString(16)}`,
        from: address,
        calls
      }
      const batchCallHash = await provider.send(EIP_5792_RPC_METHODS.WALLET_SEND_CALLS, [
        sendCallsParams
      ])
      toast({
        title: 'Success',
        description: batchCallHash,
        type: 'success'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send calls',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  function isSendCallsSupported(): boolean {
    return Boolean(
      ethereumProvider?.signer?.session?.namespaces?.['eip155']?.methods?.includes(
        EIP_5792_RPC_METHODS.WALLET_SEND_CALLS
      )
    )
  }

  if (!address || !ethereumProvider) {
    return (
      <Text fontSize="md" color="yellow">
        Wallet not connected
      </Text>
    )
  }

  if (!isSendCallsSupported()) {
    return (
      <Text fontSize="md" color="yellow">
        Wallet do not support this feature
      </Text>
    )
  }

  const allowedChains = getCapabilitySupportedChainInfoForEthers('atomicBatch',ethereumProvider, address)

  if (allowedChains.length === 0) {
    return (
      <Text fontSize="md" color="yellow">
        Account do not support this feature
      </Text>
    )
  }

  return allowedChains.find(chainInfo => chainInfo.chainId === Number(chainId)) && address ? (
    <Stack direction={['column', 'column', 'row']}>
      <Button data-test-id="sign-transaction-button" onClick={onSendCalls} isDisabled={loading}>
        Send Batch Calls to Vitalik
      </Button>
      <Spacer />
    </Stack>
  ) : (
    <Text fontSize="md" color="yellow">
      Switch to {allowedChains.map(ci => ci.chainName).join(', ')} to test this feature
    </Text>
  )
}
