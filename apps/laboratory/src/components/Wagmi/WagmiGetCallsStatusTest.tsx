import { Button, Stack, Text, Input } from '@chakra-ui/react'
import { useAccount, useConnections } from 'wagmi'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { getCallsStatus } from '@wagmi/core/experimental'
import { useCallback, useState, useEffect } from 'react'
import { useChakraToast } from '../Toast'
import { EIP_5792_RPC_METHODS } from '../../utils/EIP5792Utils'
import { CONFIGS } from '../../utils/WagmiConstants'
import { bigIntReplacer } from '../../utils/CommonUtils'
import { useRouter } from 'next/router'

export function WagmiGetCallsStatusTest() {
  const [ethereumProvider, setEthereumProvider] =
    useState<Awaited<ReturnType<(typeof EthereumProvider)['init']>>>()
  const [isLoading, setLoading] = useState(false)
  const [batchCallId, setBatchCallId] = useState('')
  const router = useRouter()

  const { status, address } = useAccount()
  const connection = useConnections()
  const toast = useChakraToast()

  const isConnected = status === 'connected'

  const onGetCallsStatus = useCallback(async () => {
    setLoading(true)
    try {
      const configType = ['email', 'all', 'wallet'].some(type => router.asPath.includes(type))
        ? 'email'
        : 'default'
      const batchCallsStatus = await getCallsStatus(CONFIGS[configType], { id: batchCallId })
      toast({
        title: 'Success',
        description: JSON.stringify(batchCallsStatus, bigIntReplacer),
        type: 'success'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to get calls status',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [batchCallId, toast])
  useEffect(() => {
    if (isConnected) {
      fetchProvider()
    }
  }, [isConnected])

  function isGetCallsStatusSupported(): boolean {
    return Boolean(
      ethereumProvider?.signer?.session?.namespaces?.['eip155']?.methods?.includes(
        EIP_5792_RPC_METHODS.WALLET_GET_CALLS_STATUS
      )
    )
  }
  async function fetchProvider() {
    const connectedProvider = await connection?.[0]?.connector?.getProvider()
    if (connectedProvider instanceof EthereumProvider) {
      setEthereumProvider(connectedProvider)
    }
  }

  if (!isConnected || !ethereumProvider || !address) {
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
        data-test-id="get-calls-status-button"
        onClick={onGetCallsStatus}
        isDisabled={isLoading}
      >
        Get Calls Status
      </Button>
    </Stack>
  )
}
