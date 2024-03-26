import { Button, useToast, Stack, Link, Text, Spacer, Flex } from '@chakra-ui/react'
import { parseEther } from 'viem'
import { useAccount, useSimulateContract, useWriteContract, useReadContract } from 'wagmi'
import { useCallback, useEffect } from 'react'
import { optimism, sepolia } from 'wagmi/chains'
import { abi, address } from '../../utils/DonutContract'

export function WagmiWriteContractTest() {
  const toast = useToast()
  const { status, chain } = useAccount()
  const {
    data: donutsOwned,
    refetch: fetchDonutsOwned,
    isLoading: donutsQueryLoading,
    isRefetching: donutsQueryRefetching
  } = useReadContract({
    abi,
    address,
    functionName: 'getBalance'
  })
  const { data: simulateData, error: simulateError } = useSimulateContract({
    abi,
    address,
    functionName: 'purchase',
    value: parseEther('0.0003'),
    args: [1]
  })
  const { writeContract, reset, data, error, isPending } = useWriteContract()
  const isConnected = status === 'connected'

  const onSendTransaction = useCallback(async () => {
    if (simulateError || !simulateData?.request) {
      toast({
        title: 'Error',
        description: 'Not able to execute this transaction. Check your balance.',
        status: 'error',
        isClosable: true
      })
    } else {
      writeContract(simulateData?.request)
      await fetchDonutsOwned()
    }
  }, [writeContract, simulateError, simulateData?.request])

  useEffect(() => {
    if (data) {
      toast({
        title: 'Donut Purchase Success!',
        description: data,
        status: 'success',
        isClosable: true
      })
    } else if (error) {
      toast({
        title: 'Error',
        description: 'Failed to purchase donut',
        status: 'error',
        isClosable: true
      })
    }
    reset()
  }, [data, error])

  const allowedChains = [sepolia.id, optimism.id] as number[]

  return allowedChains.includes(Number(chain?.id)) && status === 'connected' ? (
    <Stack direction={['column', 'column', 'row']}>
      <Button
        data-test-id="sign-transaction-button"
        onClick={onSendTransaction}
        disabled={!simulateData?.request}
        isDisabled={isPending || !isConnected}
      >
        Purchase crypto donut
      </Button>
      {donutsQueryLoading || donutsQueryRefetching ? (
        <Text>Fetching donuts...</Text>
      ) : (
        <Flex alignItems="center">
          <Text marginRight="5px">Crypto donuts left:</Text>
          <Text>{donutsOwned?.toString()}</Text>
        </Flex>
      )}
      <Spacer />

      <Link isExternal href="https://sepoliafaucet.com">
        <Button variant="outline" colorScheme="blue" isDisabled={isPending}>
          Sepolia Faucet 1
        </Button>
      </Link>

      <Link isExternal href="https://www.infura.io/faucet/sepolia">
        <Button variant="outline" colorScheme="orange" isDisabled={isPending}>
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
